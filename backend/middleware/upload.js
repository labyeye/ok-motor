const multer = require("multer");

// Memory storage (files are forwarded to ImageKit). Generous caps: they exist
// only to stop one runaway request from exhausting server RAM.
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 100 },
});
