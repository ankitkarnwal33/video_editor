const fs = require("node:fs/promises");
const utils = {};

utils.deleteDirectory = async (path) => {
  try {
    await fs.rm(path, { recursive: true });
  } catch (error) {}
};
module.exports = utils;
