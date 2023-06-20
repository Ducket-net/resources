const { fetchMany, config } = require("../functions");

async function handle() {
  await fetchMany(
    [
      {
        src: `https://sandbox.habbo.com/gamedata/external_variables/0`,
        dst: "gamedata/external_variables.txt",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/external_flash_texts/0`,
        dst: "gamedata/external_flash_texts.txt",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/override/external_override_variables/0`,
        dst: "gamedata/override/external_override_variables.txt",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/override/external_flash_override_texts/0`,
        dst: "gamedata/override/external_flash_override_texts.txt",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/furnidata_json/0`,
        dst: "gamedata/furnidata.json",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/furnidata_xml/0`,
        dst: "gamedata/furnidata.xml",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/furnidata/0`,
        dst: "gamedata/furnidata.txt",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/productdata_json/0`,
        dst: "gamedata/productdata.json",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/productdata_xml/0`,
        dst: "gamedata/productdata.xml",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/productdata/0`,
        dst: "gamedata/productdata.txt",
      },
      {
        src: `https://sandbox.habbo.com/gamedata/figuredata/0`,
        dst: "gamedata/figuredata.xml",
      },
      {
        src: `https://images.habbo.com/gordon/${config.prod}/figuremap.xml`,
        dst: "gamedata/figuremap.xml",
      },
      {
        src: `https://images.habbo.com/gordon/${config.prod}/effectmap.xml`,
        dst: "gamedata/effectmap.xml",
      },
    ],
    true
  );
}

module.exports = handle;
