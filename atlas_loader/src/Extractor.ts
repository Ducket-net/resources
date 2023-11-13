import nodePackage from '../package.json';
import {FurnitureTask} from "./tasks/FurnitureTask";

export class Extractor {

    private _furnitureTask: FurnitureTask;

    public async initialise(): Promise<void> {
        console.log("🐥 Starting");
        this._furnitureTask = new FurnitureTask();
        await this._furnitureTask.initialise();
        this._furnitureTask.run();
    }

}