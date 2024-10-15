// Controllers
const User = require("./controllers/user");
const video = require("./controllers/video");
module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("post", "/api/login", User.logUserIn);

  // Log a user out
  server.route("delete", "/api/logout", User.logUserOut);

  // Send user info
  server.route("get", "/api/user", User.sendUserInfo);

  // Update a user info
  server.route("put", "/api/user", User.updateUser);

  // ------------------------------------------------ //
  // ************ VIDEO ROUTES ************* //
  // ------------------------------------------------ //

  server.route("post", "/api/upload-video", video.uploadVideo);
  server.route("get", "/api/videos", video.getVideos);
  server.route("get", "/get-video-asset", video.getVideoAssest);
  server.route("patch", "/api/video/extract-audio", video.extractAudio);
  server.route("put", "/api/video/resize", video.resizeVideo);
};
