import fs from "fs";
import path from "path";
import {SpritesheetBuilder} from "../builders/SpritesheetBuilder";
import {OffsetBuilder} from "../builders/OffsetBuilder";
import {VisualizationBuilder} from "../builders/VisualizationBuilder";
import {deleteFurniFile} from "../utils/TemporaryFile";
import readline from "readline";

export class FurnitureTask {

    private _fileQueue: string[] = [];
    private _rootDirectory: string = '../hof_furni/';

    public initialise(): Promise<void> {
        console.log("Initialising FurnitureTask...");
        return new Promise<void>(async (resolve, reject) => {
            try {
                // Recursively read directories and files
                this.recursiveFileRead(this._rootDirectory);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    private recursiveFileRead(dirPath: string) {
        const files = fs.readdirSync(dirPath);


        //Order files by t first
        files.sort((a, b) => {
            if (a.includes("t")) {
                return -1;
            } else if (b.includes("t")) {
                return 1;
            } else {
                return 0;
            }
        });
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

    public async run() {
        console.log("Running FurnitureTask...");
        const startDate: Date = new Date();
        let fileCount: number = 0;
    
        for (const filePath of this._fileQueue) {
            const assetName: string = path.basename(filePath, path.extname(filePath));
            const directoryPath: string = path.dirname(filePath);

            try {
                fileCount += 1;

                console.log("SpritesheetBuilder: Building " + assetName + "...")
                await new SpritesheetBuilder().build(assetName,directoryPath);
                console.log("OffsetBuilder: Building " + assetName + "...")
                await new OffsetBuilder().buildFurnitureOffset(assetName, directoryPath);
                console.log("VisualizationBuilder: Building " + assetName + "...")
                console.log("Processed " + fileCount + "/" + this._fileQueue.length + " " + assetName);
                if(!await new VisualizationBuilder().buildFurnitureVisualization(assetName,directoryPath)) continue;
        

                // Define destination directory
                const destDirectory = path.join('../sprites/', assetName);
                if (!fs.existsSync(destDirectory)) {
                    fs.mkdirSync(destDirectory, { recursive: true });
                }

                // Move assetName.png and assetName.json to the destination directory
                const pngFile = path.join(directoryPath, assetName,assetName + ".png");
                const jsonFile = path.join(directoryPath, assetName,assetName + ".json");

                if (fs.existsSync(pngFile)) {
                    console.log("Moving " + pngFile + " to " + path.join(destDirectory, assetName,assetName + ".png"));
                    fs.renameSync(pngFile, path.join(destDirectory,assetName + ".png"));
                }
                if (fs.existsSync(jsonFile)) {
                    console.log("Moving " + jsonFile + " to " + path.join(destDirectory, assetName,assetName + ".json"));
                    fs.renameSync(jsonFile, path.join(destDirectory,assetName + ".json"));
                }

                console.log("Moved files for " + assetName);


                console.log("Cleanup " + assetName + "...");
                //Check if /furniName/furniName.png exists
                if (fs.existsSync(path.join(directoryPath, assetName, assetName + "_spritesheet.png"))) {
                    //Delete it
                    fs.unlinkSync(path.join(directoryPath, assetName, assetName + "_spritesheet.png"));
                }

                readline.clearLine(process.stdout, 0);
                process.stdout.cursorTo(0);
                
                process.stdout.write("\x1b[0m" + " >> " + "\x1b[33m" + fileCount + "\x1b[0m" + "/" + "\x1b[33m" + this._fileQueue.length + " \x1b[43m\x1b[37m" + assetName + "\x1b[0m");

            } catch (e) {

            }
        }
        const endDate: Date = new Date();
        console.log("FurnitureTask finished in " + (endDate.getTime() - startDate.getTime()) + "ms.", "\x1b[0m");
    }

}