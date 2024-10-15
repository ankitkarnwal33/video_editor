const cluster = require("node:cluster");
const os = require("node:os");
const videoQueue = require("./../lib/videoQueue");

// Check the process if it's primary then create new parent process

if (cluster.isPrimary) {
  const coresCount = os.availableParallelism;
  const jobs = new videoQueue();
  // Start server on all the cores
  for (let i = 0; i < coresCount; i++) {
    cluster.fork();
  }

  cluster.on("message", (worker, message) => {
    const { videoId, width, height } = message.data;
    console.log(message);
    const type = message.type;
    if (type === "new-resize") {
      jobs.enqueue({
        type: "resize",
        videoId,
        width,
        height,
      });
    }
  });
  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `PID: ${worker.process.pid} died with ( code: ${code} | Signal: ${signal})`
    );
    cluster.fork();
  });
} else {
  require("./index");
}
