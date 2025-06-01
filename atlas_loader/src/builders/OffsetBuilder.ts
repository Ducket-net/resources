import fs from "fs";
import {xml2js} from "xml-js";

export class OffsetBuilder {

    public buildFurnitureOffset(assetName: string, outputPath: string) {
        return new Promise<void>(async resolve => {
            let assetsXml: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}_assets.bin`);
            assetsXml = xml2js(assetsXml, {compact: false});
            let spritesheet: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}.json`);
            spritesheet = JSON.parse(spritesheet);

            if (spritesheet?.meta?.image) {
                spritesheet.meta.image = `${assetName}.png`;
            }

            //Metadata
            let has32: boolean = false;

            let modifiedAssets: {}[] = [];
            let sourceAssets: any[] = [];

            assetsXml.elements[0]?.elements.forEach((asset) => {

                if(asset.attributes !== undefined) {
                    const name: string = asset.attributes.name;

                    try {
                        const splittedName: string[] = asset.attributes.name.split("_");
                        splittedName.splice(splittedName.length - 4, 4);

                        //Check if it has a 32 sprite
                        if (asset.attributes.name.includes("_32_")) {
                            has32 = true;
                        }

                        const className = splittedName.join("_");
                        console.log(spritesheet.frames[asset.attributes.name]);
                        if (spritesheet.frames[asset.attributes.name] !== undefined) {
                            const { spriteSourceSize } = spritesheet.frames[asset.attributes.name];
                            spriteSourceSize.x = -parseInt(asset.attributes.x);
                            spriteSourceSize.y = -parseInt(asset.attributes.y);
                            spritesheet.frames[asset.attributes.name].flipH = asset.attributes.flipH !== undefined;
                            modifiedAssets.push(asset);
                        } else if(asset.attributes.source !== undefined) {
                            sourceAssets.push(asset);
                        }
                    } catch (e) {
                        console.log(e);
                        const splittedName: string[] = name.split("_");
                        if (splittedName[splittedName.length - 4] !== "32") {
                            console.log("\x1b[0m", ">>", "\x1b[31m", `Error finding frame ${name}`, "\x1b[0m");
                        }
                    }
                }
            });
            sourceAssets.forEach((asset) => {
                try {
                    const splittedName: string[] = asset.attributes.name.split("_");
                    splittedName.splice(splittedName.length - 4, 4);
                    const className = splittedName.join("_");

                    spritesheet.frames[asset.attributes.name] = {
                        "frame": {
                            "x": spritesheet.frames[asset.attributes.source].frame.x,
                            "y": spritesheet.frames[asset.attributes.source].frame.y,
                            "w": spritesheet.frames[asset.attributes.source].frame.w,
                            "h": spritesheet.frames[asset.attributes.source].frame.h
                        },
                        "sourceSize": {
                            "w": spritesheet.frames[asset.attributes.source].sourceSize.w,
                            "h": spritesheet.frames[asset.attributes.source].sourceSize.h
                        },
                        "spriteSourceSize": {
                            "x": -parseInt(asset.attributes.x),
                            "y": -parseInt(asset.attributes.y),
                            "w": spritesheet.frames[asset.attributes.source].spriteSourceSize.w,
                            "h": spritesheet.frames[asset.attributes.source].spriteSourceSize.h
                        },
                        "rotated": false,
                        "trimmed": true,
                        "flipH": asset.attributes.flipH !== undefined
                    }
                    modifiedAssets.push(asset);
                }catch (e) {

                }
            });

            //Adjust the metadata
            if (has32) {
                spritesheet.meta.sizes = ["64", "32"];
            } else {
                spritesheet.meta.sizes = ["64"];
            }


            fs.writeFile(`${outputPath}/${assetName}/${assetName}.json`, JSON.stringify(spritesheet), () => {
                resolve();
            });
        });
    }

    public buildPetOffset(assetName: string, outputPath: string) {
        return new Promise<void>(async resolve => {
            try {
                // Pets use .xml files instead of .bin files
                let assetsXml: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}_assets.xml`);
                assetsXml = xml2js(assetsXml, {compact: false});
                let spritesheet: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}.json`);
                spritesheet = JSON.parse(spritesheet);

                if (spritesheet?.meta?.image) {
                    spritesheet.meta.image = `${assetName}.png`;
                }

                //Metadata
                let has32: boolean = false;

                let modifiedAssets: {}[] = [];
                let sourceAssets: any[] = [];

                assetsXml.elements[0]?.elements.forEach((asset) => {

                    if(asset.attributes !== undefined) {
                        const name: string = asset.attributes.name;

                        try {
                            // Pet assets have a different naming convention
                            // Usually pet_name_direction_frame_action
                            const splittedName: string[] = asset.attributes.name.split("_");
                            
                            //Check if it has a 32 sprite
                            if (asset.attributes.name.includes("_32_")) {
                                has32 = true;
                            }

                            if (spritesheet.frames[asset.attributes.name] !== undefined) {
                                const { spriteSourceSize } = spritesheet.frames[asset.attributes.name];
                                spriteSourceSize.x = -parseInt(asset.attributes.x);
                                spriteSourceSize.y = -parseInt(asset.attributes.y);
                                spritesheet.frames[asset.attributes.name].flipH = asset.attributes.flipH !== undefined;
                                modifiedAssets.push(asset);
                            } else if(asset.attributes.source !== undefined) {
                                sourceAssets.push(asset);
                            }
                        } catch (e) {
                            console.log(e);
                            console.log("\x1b[0m", ">>", "\x1b[31m", `Error finding pet frame ${name}`, "\x1b[0m");
                        }
                    }
                });

                sourceAssets.forEach((asset) => {
                    try {
                        spritesheet.frames[asset.attributes.name] = {
                            "frame": {
                                "x": spritesheet.frames[asset.attributes.source].frame.x,
                                "y": spritesheet.frames[asset.attributes.source].frame.y,
                                "w": spritesheet.frames[asset.attributes.source].frame.w,
                                "h": spritesheet.frames[asset.attributes.source].frame.h
                            },
                            "sourceSize": {
                                "w": spritesheet.frames[asset.attributes.source].sourceSize.w,
                                "h": spritesheet.frames[asset.attributes.source].sourceSize.h
                            },
                            "spriteSourceSize": {
                                "x": -parseInt(asset.attributes.x),
                                "y": -parseInt(asset.attributes.y),
                                "w": spritesheet.frames[asset.attributes.source].spriteSourceSize.w,
                                "h": spritesheet.frames[asset.attributes.source].spriteSourceSize.h
                            },
                            "rotated": false,
                            "trimmed": true,
                            "flipH": asset.attributes.flipH !== undefined
                        }
                        modifiedAssets.push(asset);
                    }catch (e) {
                        console.error(`Error processing pet source asset ${asset.attributes.name}:`, e);
                    }
                });

                //Adjust the metadata for pets
                if (has32) {
                    spritesheet.meta.sizes = ["64", "32"];
                } else {
                    spritesheet.meta.sizes = ["64"];
                }

                // Add pet-specific metadata
                spritesheet.meta.type = "pet";

                fs.writeFile(`${outputPath}/${assetName}/${assetName}.json`, JSON.stringify(spritesheet), () => {
                    resolve();
                });
            } catch (error) {
                console.error(`Error building pet offset for ${assetName}:`, error);
                resolve();
            }
        });
    }

}