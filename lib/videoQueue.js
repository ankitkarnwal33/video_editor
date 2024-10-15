const db = require("../src/DB");
const ffmpegHelper = require("./ffmpeg");
const { deleteFile } = require("./utils");

class videoQueue {
  #jobs = [];
  #currentJob = null;
  constructor() {
    db.update();
    db.videos.forEach((video) => {
      Object.keys(video.resizes).forEach((key) => {
        if (video.resizes[key].processing) {
          const [width, height] = key.split("x");
          this.enqueue({
            type: "resize",
            videoId: video.videoId,
            width: +width,
            height: +height,
          });
        }
      });
    });
  }

  // Enqueue the incoming job.
  enqueue(job) {
    console.log(`Enqueue`);
    this.#jobs.push(job);
    this.runNext();
  }
  dequeue() {
    console.log(`Deqeue`);
    const job = this.#jobs.shift();
    return job;
  }
  runNext() {
    // If current job is not null means already processing another job
    console.log(`Run next`);
    if (this.#currentJob) return;
    // Current job is null so dequeue
    this.#currentJob = this.dequeue();
    if (!this.#currentJob) return;
    this.executeMain(this.#currentJob);
  }
  async executeMain(job) {
    console.log(`executeMain`);
    // We will take care of our main logic here.
    const { type, videoId, width, height } = job;
    if (type === "resize") {
      const video = db.videos.find((vid) => vid.videoId === videoId);

      // Resize the video
      const videoPath = `./storage/${video.videoId}/original.${video.extension}`;
      const resizedVideoPath = `./storage/${video.videoId}/${width}x${height}.${video.extension}`;

      try {
        const result = await ffmpegHelper.resizeTheVideo(
          videoPath,
          resizedVideoPath,
          width,
          height
        );
        db.update();
        const video = db.videos.find((vid) => vid.videoId === videoId);
        video.resizes[`${width}x${height}`].processing = false;
        db.save();
      } catch (err) {
        console.log(`error`);
        deleteFile(resizedVideoPath);
      }
    }

    this.#currentJob = null;
    if (this.#jobs.length > 0) {
      // Run next process.
      this.runNext();
    }
  }
}

module.exports = videoQueue;
