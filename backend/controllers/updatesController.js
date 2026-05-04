const asyncHandler = require("express-async-handler");
const ImageKit = require("imagekit");
const Updates = require("../models/Updates");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const uploadFilesToImageKit = async (files = []) => {
  const uploaded = [];
  for (const file of files) {
    try {
      const base64 = file.buffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      const result = await imagekit.upload({
        file: dataUri,
        fileName: file.originalname || `upload-${Date.now()}`,
        useUniqueFileName: true,
      });
      uploaded.push({
        url: result.url,
        fileId: result.fileId,
        name: result.name,
      });
    } catch (err) {
      console.error(
        "ImageKit upload failed for",
        file.originalname,
        err.message,
      );
      throw new Error("Image upload failed");
    }
  }
  return uploaded;
};

const createUpdate = asyncHandler(async (req, res) => {
  try {
    const { title, shortDescription, status } = req.body;
    if (!title || !shortDescription) {
      return res.status(400).json({
        success: false,
        message: "Title and short description are required",
      });
    }

    const files = req.files || [];
    let images = [];
    if (files.length) {
      images = await uploadFilesToImageKit(files);
    }

    const update = await Updates.create({
      title,
      shortDescription,
      images,
      status: status || "Active",
    });

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    console.error("Create update failed:", error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create update",
    });
  }
});

const getActiveUpdates = asyncHandler(async (req, res) => {
  const updates = await Updates.find({
    isDeleted: false,
    status: "Active",
  }).sort({ createdAt: -1 });

  const mapped = updates.map((u) => ({
    _id: u._id,
    title: u.title,
    shortDescription: u.shortDescription,
    images: u.images,
    poster: u.images && u.images.length ? u.images[0].url : null,
    status: u.status,
    createdAt: u.createdAt,
  }));
  res.json(mapped);
});

const getAllUpdatesAdmin = asyncHandler(async (req, res) => {
  const updates = await Updates.find({ isDeleted: false }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: updates });
});

const getUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = await Updates.findById(id);
  if (!update || update.isDeleted)
    return res
      .status(404)
      .json({ success: false, message: "Update not found" });

  if (update.status === "Active") {
    return res.json({ success: true, data: update });
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    return res.json({ success: true, data: update });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid" });
  }
});

const updateUpdate = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, status } = req.body;
    const update = await Updates.findById(id);
    if (!update || update.isDeleted)
      return res
        .status(404)
        .json({ success: false, message: "Update not found" });

    const files = req.files || [];
    if (files.length) {
      const images = await uploadFilesToImageKit(files);
      update.images = [...update.images, ...images];
    }

    if (title) update.title = title;
    if (shortDescription) update.shortDescription = shortDescription;
    if (status && ["Active", "Inactive"].includes(status))
      update.status = status;

    await update.save();
    res.json({ success: true, data: update });
  } catch (error) {
    console.error("Update failed:", error.message || error);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
});

const deleteUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = await Updates.findById(id);
  if (!update || update.isDeleted)
    return res
      .status(404)
      .json({ success: false, message: "Update not found" });
  update.isDeleted = true;
  update.status = "Inactive";
  await update.save();
  res.json({ success: true, message: "Update deleted" });
});

module.exports = {
  createUpdate,
  getActiveUpdates,
  getAllUpdatesAdmin,
  getUpdate,
  updateUpdate,
  deleteUpdate,
};
