const BuyLetter = require("../models/BuyLetter");
const fs = require("fs");
const path = require("path");
exports.createBuyLetter = async (req, res) => {
  try {
    const buyLetterData = {
      ...req.body,
      user: req.user.id,
    };

    // Convert date strings to Date objects
    if (buyLetterData.saleDate) {
      buyLetterData.saleDate = new Date(buyLetterData.saleDate);
    }
    if (buyLetterData.todayDate) {
      buyLetterData.todayDate = new Date(buyLetterData.todayDate);
    }

    const buyLetter = new BuyLetter(buyLetterData);
    const savedBuyLetter = await buyLetter.save();

    res.status(201).json(savedBuyLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all buy letters for the logged-in user with pagination
exports.getBuyLetters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const buyLetters = await BuyLetter.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BuyLetter.countDocuments({ user: req.user.id });

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
      return res.status(400).json({ message: "Registration number is required" });
    }

    const buyLetters = await BuyLetter.find({ 
      registrationNumber: new RegExp(registrationNumber, 'i'),
      user: req.user.id 
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
      user: req.user.id,
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update buy letters" });
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update buy letters" });
    }
    const buyLetter = await BuyLetter.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    if (buyLetter.pdfPath && fs.existsSync(buyLetter.pdfPath)) {
      fs.unlinkSync(buyLetter.pdfPath);
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
      user: req.user.id,
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
