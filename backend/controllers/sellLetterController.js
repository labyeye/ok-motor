const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");
const Vehicle = require("../models/Vehicle");

exports.createSellLetter = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user" });
    }
    const sellLetterData = {
      ...req.body,
      user: req.user.id 
    };

    if (sellLetterData.vehicle) {
      const vehicle = await Vehicle.findById(sellLetterData.vehicle);
      if (vehicle) {
        
        sellLetterData.vehicleName = vehicle.vehicleName;
        sellLetterData.vehicleModel = vehicle.vehicleModel;
        sellLetterData.vehicleColor = vehicle.vehicleColor;
        sellLetterData.registrationNumber = vehicle.registrationNumber;
        sellLetterData.chassisNumber = vehicle.chassisNumber;
        sellLetterData.engineNumber = vehicle.engineNumber;
        sellLetterData.vehiclekm = vehicle.kilometersRun?.toString() || '';
        sellLetterData.vehicleCondition = vehicle.vehicleCondition;
      }
    }

    const sellLetter = new SellLetter(sellLetterData);

    const savedSellLetter = await sellLetter.save();
    res.status(201).json(savedSellLetter);
  } catch (error) {
    console.error("Detailed error creating sell letter:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation Error",
        errors: error.errors 
      });
    }

    // Handle common mongoose cast errors or duplicate key errors explicitly
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid value provided', error: error.message });
    }

    if (error.code && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error', error: error.keyValue });
    }

    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

exports.getVehicleDetails = async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    
    if (!registrationNumber) {
      return res.status(400).json({ 
        message: "Registration number is required" 
      });
    }

    const [buyLetters, sellLetters, vehicles] = await Promise.all([
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
      }).sort({ createdAt: -1 }).limit(1),
      
      Vehicle.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        isActive: true
      }).sort({ createdAt: -1 }).limit(1)
    ]);

    const vehicleRecord = vehicles[0] || buyLetters[0] || sellLetters[0];
    
    if (!vehicleRecord) {
      return res.status(404).json({ 
        message: "No vehicle found with this registration number" 
      });
    }

    const vehicleDetails = {
      vehicleName: vehicleRecord.vehicleName,
      vehicleModel: vehicleRecord.vehicleModel,
      vehicleColor: vehicleRecord.vehicleColor,
      registrationNumber: vehicleRecord.registrationNumber,
      chassisNumber: vehicleRecord.chassisNumber,
      engineNumber: vehicleRecord.engineNumber,
      vehiclekm: vehicleRecord.vehiclekm,
      
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

exports.getSellLetters = async (req, res) => {
  try {
    
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
        { user: req.user.id }, 
        { visibility: "staff" }, 
        ...(req.user.role === "staff" ? [{}] : []), 
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
        { user: req.user.id }, 
        { visibility: "staff" }, 
        ...(req.user.role === "staff" ? [{}] : []), 
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
        { user: req.user.id }, 
        { visibility: 'staff' }, 
        
        ...(req.user.role === 'staff' ? [{}] : []) 
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

exports.updateSellLetter = async (req, res) => {
  try {
    // Only admin should reach this function (route applies `admin` middleware).
    // Lookup by id so admins can update any sell letter.
    const sellLetter = await SellLetter.findById(req.params.id);

    if (!sellLetter) {
      return res.status(404).json({ message: "Sell letter not found" });
    }

    const updated = await SellLetter.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteSellLetter = async (req, res) => {
  try {
    // Admin-only action (route uses `admin` middleware). Find by id.
    const sellLetter = await SellLetter.findById(req.params.id);

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
