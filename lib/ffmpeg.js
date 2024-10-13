const { spawn } = require("node:child_process");

const ffmpegHelper = {};

ffmpegHelper.generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Spawn a new process .
      const worker = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-ss",
        "5",
        "-vframes",
        "1",
        thumbnailPath,
      ]);
      worker.on("close", (code) => {
        if (code === 0) {
          // process ended successfully.
          resolve(0);
        } else {
          reject(1);
        }
      });
      worker.on("error", (error) => {
        reject(1);
      });
    } catch (error) {
      reject(1);
    }
  });
};

ffmpegHelper.getDimensions = (videoPath) => {
  return new Promise((resolve, reject) => {
    try {
      const worker = spawn("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0",
        videoPath,
      ]);
      let dimnets = "";
      worker.stdout.on("data", (chunk) => {
        dimnets += chunk.toString("utf8");
      });
      worker.on("close", (code) => {
        if (code === 0) {
          const dimenArr = dimnets.split(",");
          const width = +dimenArr[0];
          const height = +dimenArr[1].split("\n")[0];
          resolve({
            width,
            height,
          });
        } else {
          reject("Something bad happend");
        }
      });
      worker.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject();
    }
  });
};

ffmpegHelper.generateAudio = (videoPath, audioPath) => {
  try {
    return new Promise((resolve, reject) => {
      const worker = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-vn",
        "-c:a",
        "copy",
        audioPath,
      ]);
      worker.on("close", (code) => {
        if (code === 0) {
          resolve(0);
        } else {
          if (code === 234) {
            // Audio is not available.
            reject(code);
          }
          reject(code);
        }
      });
      worker.on("error", (error) => {
        if (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    reject(error);
  }
};

module.exports = ffmpegHelper;
