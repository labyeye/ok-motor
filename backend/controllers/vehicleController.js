// controllers/vehicleController.js
const Vehicle = require("../models/Vehicle");
const ImageKit = require("imagekit");

// Initialize ImageKit only when config is present to avoid crashing the app
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
  console.warn('ImageKit not configu#ff6b00 - missing IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY or IMAGEKIT_URL_ENDPOINT');
}

// @desc    Get ImageKit authentication parameters
// @route   GET /api/vehicles/imagekit-auth
// @access  Private
// controllers/vehicleController.js
exports.getImageKitAuth = async (req, res) => {
  try {
    if (!imagekit) {
      return res.status(500).json({
        message: "ImageKit is not configu#ff6b00 on the server. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in backend/.env",
      });
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    console.log('ImageKit auth params:', authenticationParameters); // Debug log
    
    // The SDK returns { token, expire, signature }
    // 'token' is what the upload API needs
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


// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Private
exports.createVehicle = async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      user: req.user.id,
    };

    // If images are provided, set the first one as primary if not specified
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

    // Handle duplicate key errors
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

// @desc    Get all vehicles with filters and pagination
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const conditions = {};

    // Filter by vehicle type (Car/Bike)
    if (req.query.vehicleType) {
      conditions.vehicleType = req.query.vehicleType;
    }

    // Filter by availability status
    if (req.query.availabilityStatus) {
      conditions.availabilityStatus = req.query.availabilityStatus;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      conditions.isActive = req.query.isActive === "true";
    } else {
      conditions.isActive = true; // Default to active vehicles
    }

    // Search by registration number
    if (req.query.registrationNumber) {
      conditions.registrationNumber = new RegExp(
        req.query.registrationNumber,
        "i"
      );
    }

    // Search by vehicle name (brand)
    if (req.query.vehicleName) {
      conditions.vehicleName = new RegExp(req.query.vehicleName, "i");
    }

    // Search by model
    if (req.query.vehicleModel) {
      conditions.vehicleModel = new RegExp(req.query.vehicleModel, "i");
    }

    // Filter by visibility (for staff/admin)
    if (req.user.role === "staff" || req.user.role === "admin") {
      // Staff and admin can see all vehicles
    } else {
      // Regular users see only their own vehicles or public ones
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

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check access permissions
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

// @desc    Get vehicle by registration number
// @route   GET /api/vehicles/registration/:registrationNumber
// @access  Private
exports.getVehicleByRegistration = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      registrationNumber: req.params.registrationNumber.toUpperCase(),
    }).populate("user", "name email role");

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check access permissions
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

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check permissions - only owner, staff, or admin can update
    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      vehicle.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "user" && key !== "_id") {
        vehicle[key] = req.body[key];
      }
    });

    // If images are updated and no primary image, set first as primary
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

    // Handle duplicate key errors
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

// @desc    Delete vehicle (soft delete - mark as inactive)
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check permissions - only owner or admin can delete
    if (req.user.role !== "admin" && vehicle.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Soft delete - mark as inactive
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

// @desc    Permanently delete vehicle
// @route   DELETE /api/vehicles/:id/permanent
// @access  Admin only
exports.permanentDeleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Only admin can permanently delete
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can permanently delete vehicles" });
    }

    // Delete images from ImageKit
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

// @desc    Delete image from vehicle
// @route   DELETE /api/vehicles/:id/images/:fileId
// @access  Private
exports.deleteVehicleImage = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      vehicle.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find and remove image from array
    const imageIndex = vehicle.images.findIndex(
      (img) => img.fileId === req.params.fileId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from ImageKit
    try {
      await imagekit.deleteFile(req.params.fileId);
    } catch (err) {
      console.error("Failed to delete from ImageKit:", err);
    }

    // Remove from array
    vehicle.images.splice(imageIndex, 1);

    // If deleted image was primary, set new primary
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

// @desc    Get vehicles for public website (available vehicles only)
// @route   GET /api/vehicles/public/listings
// @access  Public
exports.getPublicVehicleListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conditions = {
      isActive: true,
      availabilityStatus: "Available",
      visibility: "public",
    };

    // Optional filters: vehicleType (Car/Bike), vehicleName (brand), manufacturingYear, price range
    if (req.query.vehicleType) {
      conditions.vehicleType = req.query.vehicleType;
    }

    if (req.query.vehicleName) {
      // exact match or case-insensitive
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
      // apply to sellingPrice or expectedPrice
      conditions.$and.push({
        $or: [{ sellingPrice: pCond }, { expectedPrice: pCond }],
      });
    }

    // Filter by vehicle type
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


// @desc Get filter options for public listing page (brands, years, types, price ranges)
// @route GET /api/vehicles/public/filters
// @access Public
exports.getPublicFilters = async (req, res) => {
  try {
    // distinct brands
    const brands = await Vehicle.distinct('vehicleName', {
      isActive: true,
      availabilityStatus: 'Available',
      visibility: 'public',
    });

    // distinct years sorted desc
    const yearsRaw = await Vehicle.distinct('manufacturingYear', {
      isActive: true,
      availabilityStatus: 'Available',
      visibility: 'public',
    });
    const years = yearsRaw.filter(y => y).sort((a,b) => b - a);

    // types (Car/Bike) - use enum values present
    const types = ['Car', 'Bike'];

    // price ranges - static sensible ranges (in INR)
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
