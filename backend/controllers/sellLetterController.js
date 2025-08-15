const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");
// Create a new sell letter
exports.createSellLetter = async (req, res) => {
  try {
    const sellLetter = new SellLetter({
      ...req.body,
      user: req.user.id // Just assign the current user
    });

    const savedSellLetter = await sellLetter.save();
    res.status(201).json(savedSellLetter);
  } catch (error) {
    console.error("Detailed error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation Error",
        errors: error.errors 
      });
    }
    res.status(500).json({ 
      message: "Server Error",
      error: error.message // Include the actual error message
    });
  }
};
// Add to sellLetterController.js
exports.getVehicleDetails = async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    
    if (!registrationNumber) {
      return res.status(400).json({ 
        message: "Registration number is required" 
      });
    }

    // Search in both buy and sell letters
    const [buyLetters, sellLetters] = await Promise.all([
      BuyLetter.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        $or: [
          { user: req.user.id },
          { visibility: "staff" },
          ...(req.user.role === "staff" || req.user.role === "admin" ? [{}] : [])
        ]
      }).sort({ createdAt: -1 }).limit(1),
      
      SellLetter.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        $or: [
          { user: req.user.id },
          { visibility: "staff" },
          ...(req.user.role === "staff" || req.user.role === "admin" ? [{}] : [])
        ]
      }).sort({ createdAt: -1 }).limit(1)
    ]);

    // Prioritize buy letters (since they represent purchases)
    const vehicleRecord = buyLetters[0] || sellLetters[0];
    
    if (!vehicleRecord) {
      return res.status(404).json({ 
        message: "No vehicle found with this registration number" 
      });
    }

    // Extract relevant vehicle details
    const vehicleDetails = {
      vehicleName: vehicleRecord.vehicleName,
      vehicleModel: vehicleRecord.vehicleModel,
      vehicleColor: vehicleRecord.vehicleColor,
      registrationNumber: vehicleRecord.registrationNumber,
      chassisNumber: vehicleRecord.chassisNumber,
      engineNumber: vehicleRecord.engineNumber,
      vehiclekm: vehicleRecord.vehiclekm,
      // Add any other relevant fields
    };

    res.json(vehicleDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};
// Get all sell letters (with optional filtering)
exports.getSellLetters = async (req, res) => {
  try {
    // You might want to add filtering options here
        const sellLetters = await SellLetter.find()
      .sort({ createdAt: -1 })
      .select("-__v")
      .populate('user', 'name role');
    res.json(sellLetters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
// Add to sellLetterController.js
exports.getSellLettersByRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    if (!registrationNumber) {
      return res
        .status(400)
        .json({ message: "Registration number is required" });
    }

    const sellLetters = await SellLetter.find({
      registrationNumber: new RegExp(registrationNumber, "i"),
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: "staff" }, // Or records marked as visible to staff
        ...(req.user.role === "staff" ? [{}] : []), // Staff can see all matching registration numbers
      ],
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name role');

    res.json(sellLetters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getMySellLetters = async (req, res) => {
  try {
    const sellLetters = await SellLetter.find({
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: "staff" }, // Or records marked as visible to staff
        ...(req.user.role === "staff" ? [{}] : []), // Staff can see all matching registration numbers
      ],
    })
      .sort({ createdAt: -1 })
      .select("-__v")
      .populate('user', 'name role');
    res.json(sellLetters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getSellLetterById = async (req, res) => {
  try {
    const sellLetter = await SellLetter.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: 'staff' }, // Or records marked as visible to staff
        // Or if staff should see all records for the registration number:
        ...(req.user.role === 'staff' ? [{}] : []) // Staff can see all matching registration numbers
      ]
    });

    if (!sellLetter) {
      return res.status(404).json({ message: "Sell letter not found" });
    }

    res.json(sellLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update a sell letter
exports.updateSellLetter = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update sell letters" });
    }
    let sellLetter = await SellLetter.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!sellLetter) {
      return res.status(404).json({ message: "Sell letter not found" });
    }

    sellLetter = await SellLetter.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(sellLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete a sell letter
exports.deleteSellLetter = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update sell letters" });
    }
    const sellLetter = await SellLetter.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!sellLetter) {
      return res.status(404).json({ message: "Sell letter not found" });
    }

    await sellLetter.deleteOne();
    res.json({ message: "Sell letter removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
