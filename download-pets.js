const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class PetDownloader {
    constructor() {
        this.gameDataUrl = '';
        this.petConfiguration = '';
        this.flashClientUrl = '';
        this.pets = [];
        this.downloadedCount = 0;
        this.totalCount = 0;
    }

    async downloadPets(gameDataUrl) {
        this.gameDataUrl = gameDataUrl;
        
        console.log('🐾 Starting pet downloader...');
        console.log(`📥 Fetching game data from: ${gameDataUrl}`);
        
        try {
            // Fetch and parse game data
            await this.fetchGameData();
            
            // Parse pet configuration and flash client URL
            this.parsePetConfiguration();
            this.parseFlashClientUrl();
            
            if (!this.pets.length) {
                console.error('❌ No pets found in configuration');
                return;
            }
            
            if (!this.flashClientUrl) {
                console.error('❌ Flash client URL not found in game data');
                return;
            }
            
            console.log(`🎯 Found ${this.pets.length} pets to download`);
            console.log(`🔗 Using flash client URL: ${this.flashClientUrl}`);
            
            // Create pets directory if it doesn't exist
            const petsDir = './pets/';
            if (!fs.existsSync(petsDir)) {
                fs.mkdirSync(petsDir, { recursive: true });
            }
            
            // Download all pets
            await this.downloadAllPets();
            
            console.log(`✅ Successfully downloaded ${this.downloadedCount}/${this.totalCount} pets`);
            
        } catch (error) {
            console.error('❌ Error downloading pets:', error.message);
            process.exit(1);
        }
    }

    async fetchGameData() {
        return new Promise((resolve, reject) => {
            const client = this.gameDataUrl.startsWith('https://') ? https : http;
            const url = new URL(this.gameDataUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; HabboResourceDownloader/1.0)',
                    'Accept': 'text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache'
                }
            };
            
            const req = client.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    this.gameData = data;
                    resolve();
                });
                
                res.on('error', (err) => {
                    reject(err);
                });
            });
            
            req.on('error', (err) => {
                reject(err);
            });
            
            req.end();
        });
    }

    parsePetConfiguration() {
        // Handle multi-line pet configuration
        const lines = this.gameData.split('\n');
        let petConfigLines = [];
        let foundStart = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('pet.configuration=')) {
                foundStart = true;
                petConfigLines.push(line);
            } else if (foundStart && line.match(/^[a-zA-Z0-9,]+$/)) {
                // Continuation line (only contains letters, numbers, and commas)
                petConfigLines.push(line);
            } else if (foundStart && line.length > 0) {
                // End of configuration (found a new config key)
                break;
            }
        }
        
        if (petConfigLines.length > 0) {
            this.petConfiguration = petConfigLines.join('').replace('pet.configuration=', '');
            this.pets = this.petConfiguration.split(',').map(pet => pet.trim()).filter(pet => pet);
            console.log(`🐾 Found ${this.pets.length} pets: ${this.pets.slice(0, 10).join(', ')}${this.pets.length > 10 ? '...' : ''}`);
        } else {
            console.log('🔍 Pet configuration not found, trying fallback...');
            // Fallback: try single line match
            const petConfigMatch = this.gameData.match(/pet\.configuration=(.+)/);
            if (petConfigMatch) {
                this.petConfiguration = petConfigMatch[1];
                this.pets = this.petConfiguration.split(',').map(pet => pet.trim()).filter(pet => pet);
                console.log(`🐾 Found pets (fallback): ${this.pets.slice(0, 10).join(', ')}${this.pets.length > 10 ? '...' : ''}`);
            }
        }
    }

    parseFlashClientUrl() {
        const flashClientMatch = this.gameData.match(/flash\.client\.url=(.+)/);
        if (flashClientMatch) {
            this.flashClientUrl = flashClientMatch[1].trim();
            // Remove trailing slash if present
            this.flashClientUrl = this.flashClientUrl.replace(/\/$/, '');
        }
    }

    async downloadAllPets() {
        this.totalCount = this.pets.length;
        
        // Download pets in parallel with a concurrency limit
        const concurrentDownloads = 5;
        const chunks = [];
        
        for (let i = 0; i < this.pets.length; i += concurrentDownloads) {
            chunks.push(this.pets.slice(i, i + concurrentDownloads));
        }
        
        for (const chunk of chunks) {
            await Promise.all(chunk.map(pet => this.downloadPet(pet)));
        }
    }

    async downloadPet(petName) {
        const petUrl = `${this.flashClientUrl}/${petName}.swf`;
        const fileName = `./pets/${petName}.swf`;
        
        // Skip if file already exists
        if (fs.existsSync(fileName)) {
            console.log(`⏭️  Skipping ${petName}.swf (already exists)`);
            this.downloadedCount++;
            return;
        }
        
        return new Promise((resolve, reject) => {
            const client = petUrl.startsWith('https://') ? https : http;
            
            console.log(`📥 Downloading ${petName}.swf...`);
            
            client.get(petUrl, (res) => {
                if (res.statusCode === 200) {
                    const fileStream = fs.createWriteStream(fileName);
                    
                    res.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        fileStream.close();
                        this.downloadedCount++;
                        console.log(`✅ Downloaded ${petName}.swf (${this.downloadedCount}/${this.totalCount})`);
                        resolve();
                    });
                    
                    fileStream.on('error', (err) => {
                        fs.unlink(fileName, () => {}); // Delete partial file
                        console.error(`❌ Error writing ${petName}.swf:`, err.message);
                        reject(err);
                    });
                } else if (res.statusCode === 404) {
                    console.log(`⚠️  ${petName}.swf not found (404) - skipping`);
                    this.downloadedCount++;
                    resolve();
                } else {
                    console.error(`❌ Failed to download ${petName}.swf: HTTP ${res.statusCode}`);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            }).on('error', (err) => {
                console.error(`❌ Error downloading ${petName}.swf:`, err.message);
                reject(err);
            });
        });
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('❌ Usage: node download-pets.js <gamedata-url>');
        console.error('   Example: node download-pets.js https://www.habbo.com/gamedata/external_variables/123456');
        process.exit(1);
    }
    
    const gameDataUrl = args[0];
    const downloader = new PetDownloader();
    downloader.downloadPets(gameDataUrl);
}

module.exports = PetDownloader; 