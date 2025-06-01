import {Extractor} from "./Extractor";

// Parse command line arguments
const args = process.argv.slice(2);
const petsOnly = args.includes('--pets-only') || args.includes('--pets');
const furnitureOnly = args.includes('--furniture-only') || args.includes('--furniture');

if (petsOnly && furnitureOnly) {
    console.error("❌ Cannot use both --pets-only and --furniture-only flags");
    process.exit(1);
}

let extractor: Extractor = new Extractor();
extractor.initialise({ petsOnly, furnitureOnly });