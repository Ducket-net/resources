import nodePackage from '../package.json';
import {FurnitureTask} from "./tasks/FurnitureTask";
import {PetTask} from "./tasks/PetTask";

interface ExtractorOptions {
    petsOnly?: boolean;
    furnitureOnly?: boolean;
}

export class Extractor {

    private _furnitureTask: FurnitureTask;
    private _petTask: PetTask;

    public async initialise(options: ExtractorOptions = {}): Promise<void> {
        const { petsOnly = false, furnitureOnly = false } = options;
        
        console.log("🐥 Starting");
        
        if (petsOnly) {
            console.log("🐾 Running in pets-only mode");
        } else if (furnitureOnly) {
            console.log("🪑 Running in furniture-only mode");
        } else {
            console.log("🔄 Running all tasks");
        }
        
        // Initialize and run furniture task (unless pets-only mode)
        if (!petsOnly) {
            console.log("🪑 Initializing furniture task...");
            this._furnitureTask = new FurnitureTask();
            await this._furnitureTask.initialise();
            await this._furnitureTask.run();
        }
        
        // Initialize and run pet task (unless furniture-only mode)
        if (!furnitureOnly) {
            console.log("🐾 Initializing pet task...");
            this._petTask = new PetTask();
            await this._petTask.initialise();
            await this._petTask.run();
        }
        
        console.log("✅ All tasks completed!");
    }

}