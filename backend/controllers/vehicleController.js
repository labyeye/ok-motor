
const Vehicle = require("../models/Vehicle");
const ImageKit = require("imagekit");

let imagekit = null;
const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;
if (IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT) {
  try {
    imagekit = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
  } catch (err) {
    console.error('Failed to initialize ImageKit:', err);
    imagekit = null;
  }
} else {
  console.warn('ImageKit not configured - missing IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY or IMAGEKIT_URL_ENDPOINT');
}

exports.getImageKitAuth = async (req, res) => {
  try {
    if (!imagekit) {
      return res.status(500).json({
        message: "ImageKit is not configured on the server. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in backend/.env",
      });
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    console.log('ImageKit auth params:', authenticationParameters); 

    res.json({
      token: authenticationParameters.token,
      expire: authenticationParameters.expire,
      signature: authenticationParameters.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  } catch (error) {
    console.error("ImageKit auth error:", error);
    res.status(500).json({
      message: "Failed to generate ImageKit authentication",
      error: error.message,
    });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      user: req.user.id,
    };

    if (
      vehicleData.images &&
      vehicleData.images.length > 0 &&
      !vehicleData.primaryImage
    ) {
      vehicleData.primaryImage = vehicleData.images[0];
    }

    const vehicle = new Vehicle(vehicleData);
    const savedVehicle = await vehicle.save();

    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `A vehicle with this ${field} already exists`,
        field,
      });
    }

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conditions = {};

    if (req.query.vehicleType) {
      conditions.vehicleType = req.query.vehicleType;
    }

    if (req.query.availabilityStatus) {
      conditions.availabilityStatus = req.query.availabilityStatus;
    }

    if (req.query.isActive !== undefined) {
      conditions.isActive = req.query.isActive === "true";
    } else {
      conditions.isActive = true; 
    }

    if (req.query.registrationNumber) {
      conditions.registrationNumber = new RegExp(
        req.query.registrationNumber,
        "i"
      );
    }

    if (req.query.vehicleName) {
      conditions.vehicleName = new RegExp(req.query.vehicleName, "i");
    }

    if (req.query.vehicleModel) {
      conditions.vehicleModel = new RegExp(req.query.vehicleModel, "i");
    }

    if (req.user.role === "staff" || req.user.role === "admin") {
      
    } else {
      
      conditions.$or = [{ user: req.user.id }, { visibility: "public" }];
    }

    const vehicles = await Vehicle.find(conditions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email role");

    const total = await Vehicle.countDocuments(conditions);

    res.json({
      vehicles,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      vehicle.user._id.toString() !== req.user.id &&
      vehicle.visibility !== "public"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getVehicleByRegistration = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      registrationNumber: req.params.registrationNumber.toUpperCase(),
    }).populate("user", "name email role");

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      vehicle.user._id.toString() !== req.user.id &&
      vehicle.visibility !== "public"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle by registration:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      vehicle.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.keys(req.body).forEach((key) => {
      if (key !== "user" && key !== "_id") {
        vehicle[key] = req.body[key];
      }
    });

    if (
      req.body.images &&
      req.body.images.length > 0 &&
      !vehicle.primaryImage
    ) {
      vehicle.primaryImage = req.body.images[0];
    }

    const updatedVehicle = await vehicle.save();

    res.json(updatedVehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `A vehicle with this ${field} already exists`,
        field,
      });
    }

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (req.user.role !== "admin" && vehicle.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    vehicle.isActive = false;
    vehicle.availabilityStatus = "Not for Sale";
    await vehicle.save();

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.permanentDeleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can permanently delete vehicles" });
    }

    if (vehicle.images && vehicle.images.length > 0) {
      for (const image of vehicle.images) {
        try {
          await imagekit.deleteFile(image.fileId);
        } catch (err) {
          console.error(`Failed to delete image ${image.fileId}:`, err);
        }
      }
    }

    await vehicle.deleteOne();

    res.json({ message: "Vehicle permanently deleted successfully" });
  } catch (error) {
    console.error("Error permanently deleting vehicle:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deleteVehicleImage = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      vehicle.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const imageIndex = vehicle.images.findIndex(
      (img) => img.fileId === req.params.fileId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }

    try {
      await imagekit.deleteFile(req.params.fileId);
    } catch (err) {
      console.error("Failed to delete from ImageKit:", err);
    }

    vehicle.images.splice(imageIndex, 1);

    if (
      vehicle.primaryImage &&
      vehicle.primaryImage.fileId === req.params.fileId
    ) {
      vehicle.primaryImage =
        vehicle.images.length > 0 ? vehicle.images[0] : null;
    }

    await vehicle.save();

    res.json({ message: "Image deleted successfully", vehicle });
  } catch (error) {
    console.error("Error deleting vehicle image:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getPublicVehicleListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conditions = {
      $or: [
        { isActive: { $ne: false } },
        { isActive: { $exists: false } }
      ]
    };

    if (req.query.vehicleType) {
      conditions.vehicleType = req.query.vehicleType;
    }

    if (req.query.vehicleName) {
      
      conditions.vehicleName = new RegExp(req.query.vehicleName, 'i');
    }

    if (req.query.manufacturingYear) {
      const y = parseInt(req.query.manufacturingYear);
      if (!isNaN(y)) conditions.manufacturingYear = y;
    }

    if (req.query.priceMin || req.query.priceMax) {
      conditions.$and = conditions.$and || [];
      const pCond = {};
      if (req.query.priceMin) pCond.$gte = parseFloat(req.query.priceMin);
      if (req.query.priceMax) pCond.$lte = parseFloat(req.query.priceMax);
      
      conditions.$and.push({
        $or: [{ sellingPrice: pCond }, { expectedPrice: pCond }],
      });
    }

    if (req.query.vehicleType) {
      conditions.vehicleType = req.query.vehicleType;
    }

    const vehicles = await Vehicle.find(conditions)
      .select("-user -internalNotes -visibility")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments(conditions);

    res.json({
      vehicles,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching public vehicle listings:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getPublicFilters = async (req, res) => {
  try {
    
    const brands = await Vehicle.distinct('vehicleName', {
      isActive: true,
      availabilityStatus: 'Available',
      visibility: 'public',
    });

    const yearsRaw = await Vehicle.distinct('manufacturingYear', {
      isActive: true,
      availabilityStatus: 'Available',
      visibility: 'public',
    });
    const years = yearsRaw.filter(y => y).sort((a,b) => b - a);

    const types = ['Car', 'Bike'];

    const priceRanges = [
      { label: 'Under ₹50,000', min: 0, max: 50000 },
      { label: '₹50,000 - ₹1,00,000', min: 50001, max: 100000 },
      { label: '₹1,00,001 - ₹3,00,000', min: 100001, max: 300000 },
      { label: '₹3,00,001 - ₹5,00,000', min: 300001, max: 500000 },
      { label: 'Above ₹5,00,000', min: 500001, max: null },
    ];

    res.json({ brands, years, types, priceRanges });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = exports;
