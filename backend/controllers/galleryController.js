const Gallery = require("../models/Gallery");
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "your_public_key",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "your_private_key",
  urlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT ||
    "https://ik.imagekit.io/your_imagekit_id",
});

exports.getGalleryImages = async (req, res) => {
  try {
    const images = await Gallery.find({ isActive: true })
      .sort({ orderIndex: 1, createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images",
      error: error.message,
    });
  }
};

exports.getAllGalleryImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const images = await Gallery.find()
      .sort({ orderIndex: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name email");

    const total = await Gallery.countDocuments();

    res.json({
      success: true,
      images,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching all gallery images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images",
      error: error.message,
    });
  }
};

exports.getImageKitAuth = async (req, res) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.json({
      success: true,
      ...authenticationParameters,
    });
  } catch (error) {
    console.error("Error getting ImageKit auth:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get authentication parameters",
      error: error.message,
    });
  }
};

exports.uploadGalleryFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const token = req.user?.id;
    const savedImages = [];

    for (const file of req.files) {
      const uploadResult = await imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: "/gallery",
      });

      const galleryImage = new Gallery({
        imageUrl: uploadResult.url,
        imageKitFileId: uploadResult.fileId || uploadResult.file_id,
        title: file.originalname || "Customer Photo",
        altText: "Happy Customer",
        uploadedBy: token,
      });

      await galleryImage.save();
      savedImages.push(galleryImage);
    }

    res.status(201).json({ success: true, images: savedImages });
  } catch (error) {
    console.error("Error uploading files to ImageKit:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to upload files",
        error: error.message,
      });
  }
};

exports.uploadGalleryImage = async (req, res) => {
  try {
    const { imageUrl, imageKitFileId, title, altText, orderIndex } = req.body;

    if (!imageUrl || !imageKitFileId) {
      return res.status(400).json({
        success: false,
        message: "Image URL and ImageKit File ID are required",
      });
    }

    const galleryImage = new Gallery({
      imageUrl,
      imageKitFileId,
      title: title || "Customer Photo",
      altText: altText || "Happy Customer",
      orderIndex: orderIndex || 0,
      uploadedBy: req.user.id,
    });

    await galleryImage.save();

    res.status(201).json({
      success: true,
      message: "Gallery image uploaded successfully",
      image: galleryImage,
    });
  } catch (error) {
    console.error("Error uploading gallery image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload gallery image",
      error: error.message,
    });
  }
};

exports.updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, altText, orderIndex, isActive } = req.body;

    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    if (title !== undefined) image.title = title;
    if (altText !== undefined) image.altText = altText;
    if (orderIndex !== undefined) image.orderIndex = orderIndex;
    if (isActive !== undefined) image.isActive = isActive;

    await image.save();

    res.json({
      success: true,
      message: "Gallery image updated successfully",
      image,
    });
  } catch (error) {
    console.error("Error updating gallery image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gallery image",
      error: error.message,
    });
  }
};

exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    try {
      await imagekit.deleteFile(image.imageKitFileId);
    } catch (imagekitError) {
      console.error("Error deleting from ImageKit:", imagekitError);
    }

    await image.deleteOne();

    res.json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery image",
      error: error.message,
    });
  }
};

exports.updateGalleryOrder = async (req, res) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Images array is required",
      });
    }

    const updatePromises = images.map(({ id, orderIndex }) =>
      Gallery.findByIdAndUpdate(id, { orderIndex })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: "Gallery order updated successfully",
    });
  } catch (error) {
    console.error("Error updating gallery order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gallery order",
      error: error.message,
    });
  }
};
