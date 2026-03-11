const PUC = require("../models/PUC");
const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");

/**
 * Propagate PUC master record changes back to any SellLetter or BuyLetter
 * that references the same vehicle registration number.
 * This keeps the stale copies in sync so that any existing queries reading
 * from those documents (e.g. PDF generation) still get current data.
 */
const syncPUCToLetters = async (pucDoc) => {
  const regNo = pucDoc.vehicleRegNo || pucDoc.regNo;
  if (!regNo) return;
  const regRegex = new RegExp(`^${String(regNo).trim()}$`, "i");

  const pucFields = {
    pucIssueDate: pucDoc.pucIssueDate,
    pucExpiryDate: pucDoc.pucExpiryDate || pucDoc.pucExpiry,
    pucStatus: pucDoc.pucStatus,
    pucId: pucDoc._id,
  };

  await Promise.all([
    SellLetter.updateMany(
      { registrationNumber: regRegex },
      { $set: pucFields },
    ),
    BuyLetter.updateMany(
      { registrationNumber: regRegex },
      { $set: pucFields },
    ),
  ]);
};

exports.createPUC = async (req, res) => {
  try {
    const pucData = {
      ...req.body,
      user: req.user.id,
    };

    const puc = new PUC(pucData);
    const savedPUC = await puc.save();

    // Propagate to SellLetter & BuyLetter for any matching registration number
    try {
      await syncPUCToLetters(savedPUC);
    } catch (syncErr) {
      console.error("PUC create sync to letters failed:", syncErr);
    }

    res.status(201).json(savedPUC);
  } catch (error) {
    console.error("Error creating PUC:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getAllPUC = async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    const pucList = await PUC.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(pucList);
  } catch (error) {
    console.error("Error fetching PUC:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.updatePUC = async (req, res) => {
  try {
    let puc = await PUC.findById(req.params.id);

    if (!puc) {
      return res.status(404).json({ message: "PUC record not found" });
    }

    puc = await PUC.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Propagate changes to SellLetter & BuyLetter (keep stale copies in sync)
    try {
      await syncPUCToLetters(puc);
    } catch (syncErr) {
      console.error("PUC sync to letters failed:", syncErr);
    }

    res.json(puc);
  } catch (error) {
    console.error("Error updating PUC:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deletePUC = async (req, res) => {
  try {
    const puc = await PUC.findById(req.params.id);

    if (!puc) {
      return res.status(404).json({ message: "PUC record not found" });
    }

    await puc.deleteOne();
    res.json({ message: "PUC record deleted successfully" });
  } catch (error) {
    console.error("Error deleting PUC:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getPUCByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    if (!vehicleRegNo) {
      return res.status(400).json({ message: "vehicleRegNo is required" });
    }

    const regex = new RegExp(`^${vehicleRegNo}$`, "i");
    console.log("getPUCByVehicle called for:", vehicleRegNo);
    const puc = await PUC.findOne({ $or: [{ vehicleRegNo: regex }, { regNo: regex }] });
    console.log("getPUCByVehicle result:", !!puc);
    if (!puc) return res.status(404).json({ message: "Not found" });
    res.json(puc);
  } catch (error) {
    console.error("Error fetching PUC by vehicle:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.upsertPUCByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    if (!vehicleRegNo) {
      return res.status(400).json({ message: "vehicleRegNo is required" });
    }

    const data = {
      ...req.body,
      vehicleRegNo,
      user: req.user?.id,
    };

    const puc = await PUC.findOneAndUpdate(
      { vehicleRegNo },
      data,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    // Propagate changes to SellLetter & BuyLetter
    try {
      await syncPUCToLetters(puc);
    } catch (syncErr) {
      console.error("PUC upsert sync to letters failed:", syncErr);
    }

    res.json(puc);
  } catch (error) {
    console.error("Error upserting PUC:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
