import fs from "fs";
import {xml2js} from "xml-js";

export class VisualizationBuilder {

    public buildFurnitureVisualization(assetName: string, outputPath: string) {
        return new Promise<boolean>(async resolve => {
            try {
                console.log("\x1b[0m", ">>", "\x1b[33m", `Building visualization for ${assetName}`, "\x1b[0m");
                let spritesheet: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}.json`);
                spritesheet = JSON.parse(spritesheet);
                let indexXml: any = fs.readFileSync(`${outputPath}/${assetName}/index.bin`);
                indexXml = xml2js(indexXml, {compact: true});
                let visualizationXml: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}_visualization.bin`);
                visualizationXml = xml2js(visualizationXml, {compact: true});
                let logicXml: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}_visualization.bin`);
                logicXml = xml2js(logicXml, {compact: true});

                const furniProperty = {
                    infos: {
                        logic: undefined,
                        visualization: undefined,
                    },
                    dimensions: {
                        x: undefined,
                        y: undefined,
                        z: undefined,
                    },
                    visualization: {
                        layerCount: undefined,
                        layers: {},
                        directions: [],
                        colors: {},
                        animation: {},
                    },
                };
                furniProperty.infos.logic = indexXml?.object?._attributes?.logic;
                furniProperty.infos.visualization = indexXml?.object?._attributes?.visualization;
                furniProperty.dimensions.x = parseInt(logicXml?.objectData?.model?.dimensions?._attributes?.x);
                furniProperty.dimensions.y = parseInt(logicXml?.objectData?.model?.dimensions?._attributes?.y);
                furniProperty.dimensions.z = logicXml?.objectData?.model?.dimensions?._attributes?.z;

                const visualization = visualizationXml?.visualizationData?.graphics.visualization.filter((vis) => (vis._attributes !== undefined) && (vis._attributes.size !== undefined) && vis._attributes.size === '64').pop();
                furniProperty.visualization.layerCount = visualization?._attributes?.layerCount !== undefined ? parseInt(visualization._attributes.layerCount) : 0;

                if (visualization?.layers !== undefined) {
                    this.formatArray(visualization.layers?.layer).forEach((layer) => {
                        if (layer?._attributes.id !== undefined) {
                            furniProperty.visualization.layers[parseInt(layer._attributes.id)] = {
                                id: parseInt(layer._attributes?.id),
                                ink: layer._attributes?.ink,
                                alpha: layer._attributes?.alpha !== undefined ? parseInt(layer._attributes?.alpha) : undefined,
                                z: layer._attributes?.z,
                                tag: layer._attributes?.tag,
                                ignoreMouse: layer._attributes?.ignoreMouse === '1',
                            };
                        }
                    });
                }

                if (visualization?.directions !== undefined) {
                    this.formatArray(visualization?.directions?.direction).forEach((direction) => {
                        furniProperty.visualization.directions.push(parseInt(direction._attributes.id));
                    });
                }

                if (visualization?.colors !== undefined) {
                    this.formatArray(visualization.colors.color).forEach((color) => {
                        furniProperty.visualization.colors[parseInt(color._attributes.id)] = {};

                        if (color?.colorLayer?.length > 0) {
                            color.colorLayer.forEach((colorLayer) => {
                                furniProperty.visualization.colors[parseInt(color._attributes.id)][parseInt(colorLayer._attributes.id)] = colorLayer._attributes.color;
                            });
                        } else if (typeof color?.colorLayer === 'object' && color?.colorLayer?._attributes !== undefined && color?.colorLayer?._attributes.id !== undefined) {
                            furniProperty.visualization.colors[parseInt(color._attributes.id)][parseInt(color?.colorLayer._attributes.id)] = color?.colorLayer._attributes.color;
                        }
                    });
                }

                if (visualization?.animations !== undefined) {
                    this.formatArray(visualization.animations.animation).forEach((animation) => {
                        furniProperty.visualization.animation[animation._attributes.id] = {};

                        this.formatArray(animation?.animationLayer).forEach((animationLayer) => {
                            const frameSequence = [];

                            this.formatArray(animationLayer?.frameSequence).forEach((fs) => {
                                this.formatArray(fs.frame).forEach((elm) => {
                                    frameSequence.push(parseInt(elm._attributes.id));
                                });
                            });

                            furniProperty.visualization.animation[animation._attributes.id][animationLayer._attributes.id] = {
                                frameSequence,
                                loopCount: animationLayer?._attributes?.loopCount !== undefined ? parseInt(animationLayer?._attributes?.loopCount) : undefined,
                                random: animationLayer?._attributes?.random !== undefined ? parseInt(animationLayer?._attributes?.random) : undefined,
                                frameRepeat: animationLayer?._attributes?.frameRepeat !== undefined ? parseInt(animationLayer?._attributes?.frameRepeat) : undefined,
                            };
                        });
                    });
                }
                spritesheet.furniProperty = furniProperty;


                // Set spritesheet.meta.animations to [0,1,...] to index key values
                spritesheet.meta.animations = Object.keys(furniProperty.visualization.animation).map(Number);

                // Set spritesheet.meta.colors to [0,1,...]
                spritesheet.meta.colors = Object.keys(furniProperty.visualization.colors).map(Number);

                // Set spritesheet.meta.directions to [0,1,...]
                spritesheet.meta.directions = furniProperty.visualization.directions;


                fs.writeFile(`${outputPath}/${assetName}/${assetName}.json`, JSON.stringify(spritesheet), () => {
                    resolve(true);
                });
            } catch (e) {
                console.log(e);
                resolve(false)
            }
        });
    }

    public buildPetVisualization(assetName: string, outputPath: string) {
        return new Promise<boolean>(async resolve => {
            try {
                console.log("\x1b[0m", ">>", "\x1b[33m", `Building pet visualization for ${assetName}`, "\x1b[0m");
                let spritesheet: any = fs.readFileSync(`${outputPath}/${assetName}/${assetName}.json`);
                spritesheet = JSON.parse(spritesheet);
                
                // Check if visualization XML exists
                const visualizationPath = `${outputPath}/${assetName}/${assetName}_visualization.xml`;
                let hasVisualizationXml = false;
                let visualizationXml: any = null;
                
                if (fs.existsSync(visualizationPath)) {
                    hasVisualizationXml = true;
                    visualizationXml = fs.readFileSync(visualizationPath);
                    visualizationXml = xml2js(visualizationXml, {compact: true});
                }
                
                const petProperty = {
                    type: "pet",
                    name: assetName,
                    directions: [],
                    actions: [],
                    layers: {},
                    animations: {},
                    colors: {},
                };

                if (hasVisualizationXml && visualizationXml?.visualizationData?.graphics?.visualization) {
                    // Parse the visualization data for both 32 and 64 sizes
                    const visualizations = this.formatArray(visualizationXml.visualizationData.graphics.visualization);
                    
                    // Process 64 size visualization (primary)
                    const visualization64 = visualizations.find(vis => vis._attributes?.size === '64') || visualizations[0];
                    const visualization32 = visualizations.find(vis => vis._attributes?.size === '32');
                    
                    if (visualization64) {
                        // Extract layers
                        if (visualization64.layers?.layer) {
                            this.formatArray(visualization64.layers.layer).forEach(layer => {
                                if (layer._attributes?.id !== undefined) {
                                    petProperty.layers[layer._attributes.id] = {
                                        id: parseInt(layer._attributes.id),
                                        tag: layer._attributes.tag || '',
                                        z: layer._attributes.z || 0
                                    };
                                }
                            });
                        }
                        
                        // Extract directions
                        if (visualization64.directions?.direction) {
                            petProperty.directions = this.formatArray(visualization64.directions.direction)
                                .map(dir => parseInt(dir._attributes.id))
                                .filter(id => !isNaN(id));
                        }
                        
                        // Extract animations
                        if (visualization64.animations?.animation) {
                            this.formatArray(visualization64.animations.animation).forEach(animation => {
                                const animId = animation._attributes.id;
                                petProperty.animations[animId] = {
                                    id: animId,
                                    layers: {}
                                };
                                
                                if (animation.animationLayer) {
                                    this.formatArray(animation.animationLayer).forEach(animLayer => {
                                        const layerId = animLayer._attributes.id;
                                        const frames = [];
                                        
                                        if (animLayer.frameSequence?.frame) {
                                            this.formatArray(animLayer.frameSequence.frame).forEach(frame => {
                                                frames.push({
                                                    id: parseInt(frame._attributes.id),
                                                    offsets: this.extractOffsets(frame.offsets)
                                                });
                                            });
                                        }
                                        
                                        petProperty.animations[animId].layers[layerId] = {
                                            id: parseInt(layerId),
                                            frameRepeat: animLayer._attributes.frameRepeat ? parseInt(animLayer._attributes.frameRepeat) : 1,
                                            loopCount: animLayer._attributes.loopCount ? parseInt(animLayer._attributes.loopCount) : 1,
                                            frames: frames
                                        };
                                    });
                                }
                            });
                        }
                    }
                } else {
                    // Fallback: Extract data from frame names if no visualization XML
                    const frameNames = Object.keys(spritesheet.frames);
                    const actions = new Set<string>();
                    const directions = new Set<number>();

                    frameNames.forEach(frameName => {
                        // Pet frame naming convention: petname_size_layer_direction_action
                        const parts = frameName.split('_');
                        if (parts.length >= 4) {
                            const sizeOrLayer = parts[1];
                            const possibleDirection = parseInt(parts[2]);
                            const action = parts[parts.length - 1];
                            
                            if (!isNaN(possibleDirection)) {
                                directions.add(possibleDirection);
                            }
                            if (action && !isNaN(parseInt(action))) {
                                actions.add(action);
                            }
                        }
                    });

                    petProperty.directions = Array.from(directions).sort((a, b) => a - b);
                    petProperty.actions = Array.from(actions);
                    
                    // Default layers for pets without visualization XML
                    petProperty.layers = {
                        0: { id: 0, tag: 'body', z: 0 },
                        1: { id: 1, tag: 'head', z: 10 },
                        2: { id: 2, tag: 'tail', z: 10 },
                        3: { id: 3, tag: 'emoticon', z: 11 }
                    };
                }

                // Set spritesheet properties
                spritesheet.petProperty = petProperty;
                spritesheet.meta.type = "pet";
                spritesheet.meta.directions = petProperty.directions;
                spritesheet.meta.animations = Object.keys(petProperty.animations).map(Number);
                spritesheet.meta.colors = Object.keys(petProperty.colors).map(Number);
                spritesheet.meta.layers = Object.keys(petProperty.layers).map(Number);

                // ----------------------------------------------------------------
                // PixiJS compatibility: Build root-level "animations" object so that
                // PIXI.Spritesheet will automatically create Texture arrays that can
                // be consumed by PIXI.AnimatedSprite / Sprite animations.
                //
                // We keep the grouping logic deliberately simple and generic:
                //   • We split each frame name by "_".
                //   • The final segment is considered the animation frame / action id.
                //     For Habbo‐style pets this maps nicely to their action identifiers
                //     (e.g. 0 = stand, 1 = move, 2 = lay, …).
                //   • All frames that share the same action id are grouped together.
                //
                // The consumer can therefore do something like:
                //     const sheet = await Assets.load('terrier.json');
                //     const anim = new AnimatedSprite(sheet.animations['0']); // stand
                //
                // Sorting frames alphabetically guarantees deterministic ordering.
                // ----------------------------------------------------------------

                const pixiAnimations: Record<string, string[]> = {};

                Object.keys(spritesheet.frames).forEach((frameName) => {
                    const segments = frameName.split('_');
                    if (segments.length < 2) return; // safety guard – malformed name

                    const actionId = segments[segments.length - 1];

                    if (!pixiAnimations[actionId]) {
                        pixiAnimations[actionId] = [];
                    }

                    pixiAnimations[actionId].push(frameName);
                });

                // Ensure each animation list is in a stable order. Alphabetical order
                // works because Habbo frame names include incremental identifiers.
                Object.keys(pixiAnimations).forEach((key) => {
                    pixiAnimations[key].sort();
                });

                // Attach to spritesheet root so PIXI picks it up automatically.
                spritesheet.animations = pixiAnimations;

                fs.writeFile(
                    `${outputPath}/${assetName}/${assetName}.json`,
                    JSON.stringify(spritesheet),
                    () => {
                        resolve(true);
                    }
                );
            } catch (e) {
                console.log(`Error building pet visualization for ${assetName}:`, e);
                resolve(false);
            }
        });
    }
    
    private extractOffsets(offsetsElement: any): any {
        const offsets = {};
        if (offsetsElement?.offset) {
            this.formatArray(offsetsElement.offset).forEach(offset => {
                if (offset._attributes?.direction !== undefined) {
                    offsets[offset._attributes.direction] = {
                        x: offset._attributes.x ? parseInt(offset._attributes.x) : 0,
                        y: offset._attributes.y ? parseInt(offset._attributes.y) : 0
                    };
                }
            });
        }
        return offsets;
    }

    formatArray(elm: any) {
        if (elm === undefined) return [];
        return elm.length === undefined ? [elm] : elm;
    }

}