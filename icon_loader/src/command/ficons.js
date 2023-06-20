const { fetchMany, fetchJson, config } = require("../functions");

async function parse(json) {
  const all = [
    ...json.roomitemtypes.furnitype,
    ...json.wallitemtypes.furnitype,
  ];

  return new Set(
    all.map((item) => {
      return {
        revision: item.revision,
        name: `${item.classname.replace("*", "_")}_icon.png`,
      };
    })
  );
}

async function handle() {
  const json = await fetchJson(
    `https://sandbox.habbo.com/gamedata/furnidata_json/0`
  );
  const all = await parse(json);

  await fetchMany(
    [...all].map((item) => {
      return {
        src: `https://images.habbo.com/dcr/hof_furni/${item.revision}/${item.name}`,
        dst: config.revision ? `${item.revision}/${item.name}` : `${item.name}`,
      };
    })
  );
}

module.exports = handle;
