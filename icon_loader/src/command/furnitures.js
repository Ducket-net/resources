const { fetchMany, fetchJson, config } = require("../functions");

async function parse(json) {
  const all = [
    ...json.roomitemtypes.furnitype,
    ...json.wallitemtypes.furnitype,
  ];

  const map = [];

  all.forEach((item) => {
    map.push({
      revision: item.revision,
      name: `${item.classname.replace("*", "_")}_icon.png`,
    });
  });

  return new Set(map);
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
        dst: config.revision
          ? `dcr/hof_furni/${item.revision}/${item.name}`
          : `dcr/hof_furni/${item.name}`,
      };
    })
  );
}

module.exports = handle;
