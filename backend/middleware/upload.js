const multer = require("multer");

// Memory storage (files are forwarded to ImageKit). Cap size and count so one
// request can't exhaust server memory.
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 40 },
});
