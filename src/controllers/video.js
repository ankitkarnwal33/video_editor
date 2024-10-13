const path = require("path");
const fs = require("fs/promises");
const { pipeline } = require("stream/promises");
const { randomBytes } = require("node:crypto");
const db = require("../DB");
const { deleteDirectory } = require("../../lib/utils");
const { generateThumbnail, getDimensions } = require("../../lib/ffmpeg");
const ffmpegHelper = require("../../lib/ffmpeg");
// Function to upload the video and generate the thumbnail.
const uploadVideo = async (req, res, handleErr) => {
  const specifiedFileName = req.headers.filename;
  const name = path.parse(specifiedFileName).name;
  const extension = path.extname(specifiedFileName).substring(1);
  //   console.log(specifiedFileName, name, extension);

  // Create new unique directory for each received video
  const videoId = randomBytes(4).toString("hex");

  try {
    await fs.mkdir(`./storage/${videoId}`, { recursive: true });
    const fileHandle = await fs.open(
      `./storage/${videoId}/original.${extension}`,
      "w"
    );
    const fileStream = fileHandle.createWriteStream();
    await pipeline(req, fileStream);

    // Generate thumbnail from the video.
    const videoPath = `./storage/${videoId}/original.${extension}`;
    const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`;
    await generateThumbnail(videoPath, thumbnailPath);

    // Get dimentions of the video

    const dimensions = await getDimensions(videoPath);

    // Save video details.
    db.update();
    db.videos.unshift({
      id: db.videos.length,
      videoId: videoId,
      extension: extension,
      name: name,
      userId: req.userId,
      dimensions,
      resizes: {},
      extractedAudio: false,
    });
    db.save();
    // At this point file should be saved in the unique videoId directory
    return res.status(201).json({
      status: "success",
      message: "Video has been uploaded !",
    });
  } catch (error) {
    // Delete the directory with incomplete uploaded video.
    deleteDirectory(`./storage/${videoId}`);
    if (error.code === "ECONNRESET")
      return handleErr({
        status: 400,
        message: "Upload aborted.",
      });
    return handleErr({ message: "Something bad happened!" });
  }
};

const getVideos = (req, res, handleErr) => {
  const userId = req.userId;
  db.update();
  const videos = db.videos.filter((video) => video.userId === userId);
  return res.status(200).json(videos);
};

const getVideoAssest = async (req, res, handleErr) => {
  const videoId = req.params.get("videoId");
  db.update();
  const video = db.videos.find((video) => video.videoId === videoId);
  const type = req.params.get("type");
  let file;
  let mimeType;
  let fileStream;
  try {
    switch (type) {
      case "thumbnail":
        res.setHeader("Content-Type", "image/jpeg");
        file = await fs.open(`./storage/${videoId}/thumbnail.jpg`, "r");
        break;
      case "audio":
        mimeType = "audio/aac";
        res.setHeader("Content-Type", mimeType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${video.name}-audio.aac`
        );
        file = await fs.open(`./storage/${videoId}/audio.aac`, "r");
        break;
      case "resize":
        mimeType = `video/mp4`;
        res.setHeader("Content-Type", mimeType);

        file = await fs.open(
          `./storage/${video.videoId}/${video.width}x${video.height}.${video.extension}`,
          "r"
        );

        break;
      case "original":
        mimeType = `video/mp4`;
        file = await fs.open(
          `./storage/${video.videoId}/original.${video.extension}`,
          "r"
        );
        res.setHeader("Content-Type", mimeType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${video.name}.${video.extension}`
        );

        break;
    }
    fileStream = file.createReadStream();
    await pipeline(fileStream, res);
    file.close();
    return res.status(200);
  } catch (error) {
    console.log(error);
  }
};

const extractAudio = async (req, res, handleErr) => {
  const videoId = req.params.get("videoId");
  if (!videoId)
    return res.json({ status: 404, message: "Please select video file" });

  db.update();
  const video = db.videos.find((video) => video.videoId === videoId);
  if (!video)
    return res.json({
      status: 404,
      message: "Video is not available upload again.",
    });

  try {
    const videoPath = `./storage/${video.videoId}/original.${video.extension}`;
    const audioPath = `./storage/${video.videoId}/audio.aac`;
    const result = await ffmpegHelper.generateAudio(videoPath, audioPath);
    if (result === 234) {
      // Some error occurred
      return handleErr({
        status: 404,
        message: "Video does not have any audio.",
      });
    }
    video.extractedAudio = true;
    db.save();
    return res.json({ message: "Video to audio conversion successfull." });
  } catch (error) {
    res.json({ message: "Something bad happened" });
  }
};

const controller = {
  uploadVideo,
  getVideos,
  getVideoAssest,
  extractAudio,
  resizeVideo,
};

module.exports = controller;
