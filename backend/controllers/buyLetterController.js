const BuyLetter = require("../models/BuyLetter");
const Vehicle = require("../models/Vehicle");
const fs = require("fs");
const path = require("path");

exports.createBuyLetter = async (req, res) => {
  try {
    const buyLetterData = {
      ...req.body,
      user: req.user.id,
      visibility: req.body.visibility || "private",
    };

    if (buyLetterData.vehicle) {
      const vehicle = await Vehicle.findById(buyLetterData.vehicle);
      if (vehicle) {
        buyLetterData.vehicleName = vehicle.vehicleName;
        buyLetterData.vehicleModel = vehicle.vehicleModel;
        buyLetterData.vehicleColor = vehicle.vehicleColor;
        buyLetterData.registrationNumber = vehicle.registrationNumber;
        buyLetterData.chassisNumber = vehicle.chassisNumber;
        buyLetterData.engineNumber = vehicle.engineNumber;
        buyLetterData.vehiclekm = vehicle.kilometersRun?.toString() || "";
        buyLetterData.vehicleCondition = vehicle.vehicleCondition;
      }
    }

    if (buyLetterData.saleDate) {
      buyLetterData.saleDate = new Date(buyLetterData.saleDate);
    }
    if (buyLetterData.todayDate) {
      buyLetterData.todayDate = new Date(buyLetterData.todayDate);
    }

    // If registrationNumber is provided, check for existing document to avoid duplicate-key errors
    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (
      buyLetterData.registrationNumber &&
      String(buyLetterData.registrationNumber).trim()
    ) {
      const regex = new RegExp(
        `^${escapeRegExp(String(buyLetterData.registrationNumber).trim())}$`,
        "i"
      );
      const existing = await BuyLetter.findOne({ registrationNumber: regex });
      if (existing) {
        // Return conflict with existing document so frontend can reuse it
        return res
          .status(409)
          .json({
            message: "Buy letter with this registration number already exists",
            existing,
          });
      }
    }

    const buyLetter = new BuyLetter(buyLetterData);
    const savedBuyLetter = await buyLetter.save();

    res.status(201).json(savedBuyLetter);
  } catch (error) {
    console.error("Error creating buy letter:", error);
    // Handle duplicate key error more gracefully
    if (error && (error.code === 11000 || error.name === "MongoServerError")) {
      const dupKey = error.keyValue || {};
      return res
        .status(409)
        .json({ message: "Duplicate key error", dupKey, error: error.message });
    }

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getBuyLetters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const conditions = {
      $or: [
        { user: req.user.id },
        { visibility: "staff" },
        ...(req.user.role === "staff" || req.user.role === "admin" ? [{}] : []),
      ],
    };

    const buyLetters = await BuyLetter.find(conditions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name role")
      .populate("vehicle");

    const total = await BuyLetter.countDocuments(conditions);

    res.json({
      buyLetters,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getBuyLettersByRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    if (!registrationNumber) {
      return res
        .status(400)
        .json({ message: "Registration number is required" });
    }

    const buyLetters = await BuyLetter.find({
      registrationNumber: new RegExp(registrationNumber, "i"),
      $or: [
        { user: req.user.id },
        { visibility: "staff" },
        ...(req.user.role === "staff" || req.user.role === "admin" ? [{}] : []),
      ],
    }).sort({ createdAt: -1 });

    res.json(buyLetters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getBuyLetterById = async (req, res) => {
  try {
    const buyLetter = await BuyLetter.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { visibility: "staff" },

        ...(req.user.role === "staff" ? [{}] : []),
      ],
    });

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    res.json(buyLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateBuyLetter = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update buy letters" });
    }
    let buyLetter = await BuyLetter.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    buyLetter = await BuyLetter.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(buyLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteBuyLetter = async (req, res) => {
  try {
    // Find the buy letter by id
    const buyLetter = await BuyLetter.findById(req.params.id);

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    // Allow deletion if admin OR owner
    const isOwner = buyLetter.user && buyLetter.user.toString() === req.user.id;
    if (req.user.role !== "admin" && !isOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this buy letter" });
    }

    if (buyLetter.pdfPath && fs.existsSync(buyLetter.pdfPath)) {
      try {
        fs.unlinkSync(buyLetter.pdfPath);
      } catch (e) {
        console.warn("Failed to remove pdfPath:", e);
      }
    }

    await buyLetter.deleteOne();
    res.json({ message: "Buy letter removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.saveBuyLetterPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfData } = req.body;

    if (!pdfData) {
      return res.status(400).json({ message: "PDF data is required" });
    }

    const buyLetter = await BuyLetter.findOne({
      _id: id,
      $or: [
        { user: req.user.id },
        { visibility: "staff" },

        ...(req.user.role === "staff" ? [{}] : []),
      ],
    });

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `buy_letter_${id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(pdfData.split("base64,")[1], "base64");

    fs.writeFileSync(filePath, buffer);

    buyLetter.pdfPath = filePath;
    await buyLetter.save();

    res.json({ message: "PDF saved successfully", filePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
