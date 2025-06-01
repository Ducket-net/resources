import fs from "fs";
import path from "path";
import {SpritesheetBuilder} from "../builders/SpritesheetBuilder";
import {OffsetBuilder} from "../builders/OffsetBuilder";
import {VisualizationBuilder} from "../builders/VisualizationBuilder";
import readline from "readline";
import { execSync } from "child_process";

export class PetTask {

    private _fileQueue: string[] = [];
    private _rootDirectory: string = '../pets/';

    public initialise(): Promise<void> {
        console.log("Initialising PetTask...");
        return new Promise<void>(async (resolve, reject) => {
            try {
                // Check if pets directory exists
                if (!fs.existsSync(this._rootDirectory)) {
                    console.log(`⚠️  Pets directory ${this._rootDirectory} does not exist. Skipping pet processing.`);
                    resolve();
                    return;
                }

                // Recursively read directories and files
                this.recursiveFileRead(this._rootDirectory);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    private recursiveFileRead(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        const files = fs.readdirSync(dirPath);

        // Order files alphabetically for consistency
        files.sort();

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.recursiveFileRead(filePath);
            } else if (path.extname(file) === ".swf") {
                this._fileQueue.push(filePath);
            } else {
                console.log("\x1b[0m", ">>", "\x1b[31m", `Ignoring ${file}, it's not a .swf file.`, "\x1b[0m");
            }
        });
    }

    private async extractSWFFiles(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                console.log("🐾 Extracting pet SWF files...");
                execSync(`npx habbo-swf-extractor --in ${this._rootDirectory} --out ${this._rootDirectory}`, { 
                    stdio: 'inherit' 
                });
                console.log("✅ Pet SWF extraction completed");
                resolve();
            } catch (error) {
                console.error("❌ Error extracting pet SWF files:", error);
                reject(error);
            }
        });
    }

    public async run() {
        if (this._fileQueue.length === 0) {
            console.log("🐾 No pet SWF files found to process.");
            return;
        }

        // First extract all SWF files
        await this.extractSWFFiles();

        console.log("Running PetTask...");
        const startDate: Date = new Date();
        let fileCount: number = 0;
    
        for (const filePath of this._fileQueue) {
            const assetName: string = path.basename(filePath, path.extname(filePath));
            const directoryPath: string = path.dirname(filePath);

            try {
                fileCount += 1;

                console.log("🐾 SpritesheetBuilder: Building pet " + assetName + "...")
                await new SpritesheetBuilder().build(assetName, directoryPath);
                
                console.log("🐾 OffsetBuilder: Building pet " + assetName + "...")
                await new OffsetBuilder().buildPetOffset(assetName, directoryPath);
                
                console.log("🐾 VisualizationBuilder: Building pet " + assetName + "...")
                console.log("🐾 Processed " + fileCount + "/" + this._fileQueue.length + " " + assetName);
                
                if(!await new VisualizationBuilder().buildPetVisualization(assetName, directoryPath)) continue;
        
                // Define destination directory
                const destDirectory = path.join('../sprites/', 'pets', assetName);
                if (!fs.existsSync(destDirectory)) {
                    fs.mkdirSync(destDirectory, { recursive: true });
                }

                // Move assetName.png and assetName.json to the destination directory
                const pngFile = path.join(directoryPath, assetName, assetName + ".png");
                const jsonFile = path.join(directoryPath, assetName, assetName + ".json");

                if (fs.existsSync(pngFile)) {
                    console.log("🐾 Moving " + pngFile + " to " + path.join(destDirectory, assetName + ".png"));
                    fs.renameSync(pngFile, path.join(destDirectory, assetName + ".png"));
                }
                if (fs.existsSync(jsonFile)) {
                    console.log("🐾 Moving " + jsonFile + " to " + path.join(destDirectory, assetName + ".json"));
                    fs.renameSync(jsonFile, path.join(destDirectory, assetName + ".json"));
                }

                console.log("🐾 Moved files for pet " + assetName);

                console.log("🐾 Cleanup " + assetName + "...");
                // Check if /petName/petName.png exists
                if (fs.existsSync(path.join(directoryPath, assetName, assetName + "_spritesheet.png"))) {
                    // Delete it
                    fs.unlinkSync(path.join(directoryPath, assetName, assetName + "_spritesheet.png"));
                }

                readline.clearLine(process.stdout, 0);
                process.stdout.cursorTo(0);
                
                process.stdout.write("\x1b[0m" + " >> " + "\x1b[33m" + fileCount + "\x1b[0m" + "/" + "\x1b[33m" + this._fileQueue.length + " \x1b[46m\x1b[37m" + "🐾 " + assetName + "\x1b[0m");

            } catch (e) {
                console.error(`🐾 Error processing pet ${assetName}:`, e);
            }
        }
        
        const endDate: Date = new Date();
        console.log("\n🐾 PetTask finished in " + (endDate.getTime() - startDate.getTime()) + "ms.", "\x1b[0m");
    }
} 