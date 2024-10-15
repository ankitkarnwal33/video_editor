const fs = require("node:fs/promises");
const utils = {};

utils.deleteDirectory = async (path) => {
  try {
    await fs.rm(path, { recursive: true });
  } catch (error) {}
};

utils.deleteFile = async (path) => {
  try {
    await fs.unlink(path);
  } catch (err) {
    console.log(err);
  }
};
module.exports = utils;
