import nodeSpriteGenerator from 'node-sprite-generator';

export class SpritesheetBuilder {

    public build(assetName: string, outputPath: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            console.log(outputPath);
            try {
                nodeSpriteGenerator({
                    src: [
                        `${outputPath}/${assetName}/*.png`
                    ],
                    spritePath: `${outputPath}/${assetName}/${assetName}.png`,
                    stylesheetPath: `${outputPath}/${assetName}/${assetName}.json`,
                    layout: 'packed',
                    compositor: 'jimp',
                    stylesheet: './src/assets/spritesheet.tpl',
                }, (err) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    resolve(true);
                });
            } catch(e) {
                resolve(false);
            }
        });
    }

}