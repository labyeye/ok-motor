const PUC = require("../models/PUC");
const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");

const normalizePucPayload = (payload = {}) => {
  const normalized = { ...payload };

  if (normalized.vehicleRegNo && !normalized.regNo) {
    normalized.regNo = normalized.vehicleRegNo;
  }
  if (normalized.regNo && !normalized.vehicleRegNo) {
    normalized.vehicleRegNo = normalized.regNo;
  }

  // Prefer pucExpiry (form field) over pucExpiryDate so edit flows don't keep stale values.
  const expirySource = normalized.pucExpiry || normalized.pucExpiryDate || null;
  if (expirySource) {
    const parsed = new Date(expirySource);
    if (!isNaN(parsed.getTime())) {
      normalized.pucExpiryDate = parsed;
      normalized.pucExpiry = parsed;
    }
  }

  const issueSource = normalized.pucIssueDate || null;
  if (issueSource) {
    const parsed = new Date(issueSource);
    if (!isNaN(parsed.getTime())) {
      normalized.pucIssueDate = parsed;
    }
  }

  if (!normalized.sourceType) {
    normalized.sourceType = "manual";
  }

  return normalized;
};

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
    BuyLetter.updateMany({ registrationNumber: regRegex }, { $set: pucFields }),
  ]);
};

exports.createPUC = async (req, res) => {
  try {
    const pucData = {
      ...normalizePucPayload(req.body),
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

    const normalizedPayload = normalizePucPayload(req.body);

    // Add version tracking metadata
    const editedDate = new Date();
    normalizedPayload.editedAt = editedDate;
    normalizedPayload.editedBy = req.user?.id || null;
    normalizedPayload.version = (puc.version || 1) + 1;
    normalizedPayload.previousVersionId = puc._id;

    puc = await PUC.findByIdAndUpdate(req.params.id, normalizedPayload, {
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
    const puc = await PUC.findOne({
      $or: [{ vehicleRegNo: regex }, { regNo: regex }],
    });
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

    const normalizedBody = normalizePucPayload(req.body);
    const data = {
      ...normalizedBody,
      vehicleRegNo,
      regNo: normalizedBody.regNo || vehicleRegNo,
      user: req.user?.id,
    };

    const regRegex = new RegExp(`^${String(vehicleRegNo).trim()}$`, "i");

    const puc = await PUC.findOneAndUpdate(
      { $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }] },
      data,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
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
