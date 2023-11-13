# Atlas Loader

Based on Scuti Extractor, this mini node app goes through all of the hof files and converts them into one that can be used by PixiJS 8+

I am using this as apart of a Github action.

## Installation

- Clone the repo
- Run `npm install`
- Place your resources in the parent directory.
  - This app references it as ../hof_furni

## Result

Once you've run this, you should see your assets populate inside the atlas-data directory. As {itemName}/{itemName}.json & {itemName}/{itemName}.png which is the atlas map, and spritesheet.
