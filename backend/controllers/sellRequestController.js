const asyncHandler = require('express-async-handler');
const ImageKit = require('imagekit');
const SellRequest = require('../models/SellRequest');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Upload files from req.files (multer memory storage)
const uploadFilesToImageKit = async (files = []) => {
  const uploaded = [];
  for (const file of files) {
    // file.buffer is available via multer memoryStorage
    // ImageKit expects base64 or a stream; convert buffer to data URI base64
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    const result = await imagekit.upload({
      file: dataUri,
      fileName: file.originalname,
      useUniqueFileName: true,
    });
    uploaded.push({ url: result.url, fileId: result.fileId, name: result.name });
  }
  return uploaded;
};

// @desc Create sell request (public)
// @route POST /api/sell-request
// @access Public
const createSellRequest = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, brand, model, year, price, notes } = req.body;

    // Validate required
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email and phone are required' });
    }

    const files = req.files || [];
    let images = [];
    if (files.length) {
      images = await uploadFilesToImageKit(files);
    }

    const sell = await SellRequest.create({
      name,
      email,
      phone,
      brand,
      model,
      year,
      price: price ? Number(price) : undefined,
      images,
      notes,
    });

    res.status(201).json({ success: true, data: sell });
  } catch (error) {
    console.error('Create sell request failed:', error);
    res.status(500).json({ success: false, message: 'Failed to create sell request' });
  }
});

// @desc Get all sell requests (admin)
// @route GET /api/sell-request
// @access Admin
const getAllSellRequests = asyncHandler(async (req, res) => {
  const sellRequests = await SellRequest.find().sort({ createdAt: -1 });
  res.json({ success: true, data: sellRequests });
});

// @desc Get single sell request
// @route GET /api/sell-request/:id
// @access Admin
const getSellRequest = asyncHandler(async (req, res) => {
  const sell = await SellRequest.findById(req.params.id);
  if (!sell) return res.status(404).json({ success: false, message: 'Sell request not found' });
  res.json({ success: true, data: sell });
});

// @desc Update status
// @route PATCH /api/sell-request/:id/status
// @access Admin
const updateSellRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const sell = await SellRequest.findById(req.params.id);
  if (!sell) return res.status(404).json({ success: false, message: 'Sell request not found' });
  sell.status = status;
  await sell.save();
  res.json({ success: true, data: sell });
});

module.exports = {
  createSellRequest,
  getAllSellRequests,
  getSellRequest,
  updateSellRequestStatus,
};
