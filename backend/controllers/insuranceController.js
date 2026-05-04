const Insurance = require("../models/Insurance");
const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");

const normalizeInsurancePayload = (payload = {}) => {
  const normalized = { ...payload };

  if (normalized.insurancePolicyNo && !normalized.insurancePolicyNumber) {
    normalized.insurancePolicyNumber = normalized.insurancePolicyNo;
  }
  if (normalized.insurancePolicyNumber && !normalized.insurancePolicyNo) {
    normalized.insurancePolicyNo = normalized.insurancePolicyNumber;
  }

  const expirySource =
    normalized.insuranceExpiryDate || normalized.insuranceExpiry || null;
  if (expirySource) {
    const parsed = new Date(expirySource);
    if (!isNaN(parsed.getTime())) {
      normalized.insuranceExpiryDate = parsed;
      normalized.insuranceExpiry = parsed;
    }
  }

  if (!normalized.sourceType) {
    normalized.sourceType = "manual";
  }

  return normalized;
};

const syncInsuranceToLetters = async (insDoc) => {
  const regNo = insDoc.vehicleRegNo || insDoc.regNo;
  if (!regNo) return;
  const regRegex = new RegExp(`^${String(regNo).trim()}$`, "i");

  const insFields = {
    insuranceCompany: insDoc.insuranceCompany,
    insurancePolicyNumber:
      insDoc.insurancePolicyNumber || insDoc.insurancePolicyNo,
    insuranceExpiryDate: insDoc.insuranceExpiryDate || insDoc.insuranceExpiry,
    insuranceStatus: insDoc.insuranceStatus,
    insuranceId: insDoc._id,
  };

  await Promise.all([
    SellLetter.updateMany(
      { registrationNumber: regRegex },
      { $set: insFields },
    ),
    BuyLetter.updateMany({ registrationNumber: regRegex }, { $set: insFields }),
  ]);
};

exports.createInsurance = async (req, res) => {
  try {
    const insuranceData = {
      ...normalizeInsurancePayload(req.body),
      user: req.user.id,
    };

    const insurance = new Insurance(insuranceData);
    const savedInsurance = await insurance.save();

    try {
      await syncInsuranceToLetters(savedInsurance);
    } catch (syncErr) {
      console.error("Insurance create sync to letters failed:", syncErr);
    }

    res.status(201).json(savedInsurance);
  } catch (error) {
    console.error("Error creating insurance:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Duplicate entry for Registration Number or other unique field",
        error: error.message,
      });
    }
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getAllInsurance = async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    const insuranceList = await Insurance.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(insuranceList);
  } catch (error) {
    console.error("Error fetching insurance:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({ message: "Insurance record not found" });
    }

    await insurance.deleteOne();
    res.json({ message: "Insurance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting insurance:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.updateInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({ message: "Insurance record not found" });
    }

    const normalizedPayload = normalizeInsurancePayload(req.body);

    const editedDate = new Date();
    normalizedPayload.editedAt = editedDate;
    normalizedPayload.editedBy = req.user?.id || null;
    normalizedPayload.version = (insurance.version || 1) + 1;
    normalizedPayload.previousVersionId = insurance._id;

    const updatedInsurance = await Insurance.findByIdAndUpdate(
      req.params.id,
      normalizedPayload,
      { new: true, runValidators: true },
    );

    try {
      await syncInsuranceToLetters(updatedInsurance);
    } catch (syncErr) {
      console.error("Insurance sync to letters failed:", syncErr);
    }

    res.json(updatedInsurance);
  } catch (error) {
    console.error("Error updating insurance:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getInsuranceByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    if (!vehicleRegNo) {
      return res.status(400).json({ message: "vehicleRegNo is required" });
    }

    const regex = new RegExp(`^${vehicleRegNo}$`, "i");
    console.log("getInsuranceByVehicle called for:", vehicleRegNo);
    const insurance = await Insurance.findOne({
      $or: [{ vehicleRegNo: regex }, { regNo: regex }],
    });
    console.log("getInsuranceByVehicle result:", !!insurance);

    if (!insurance) return res.status(404).json({ message: "Not found" });

    res.json(insurance);
  } catch (error) {
    console.error("Error fetching insurance by vehicle:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.upsertInsuranceByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    if (!vehicleRegNo) {
      return res.status(400).json({ message: "vehicleRegNo is required" });
    }

    const data = {
      ...normalizeInsurancePayload(req.body),
      vehicleRegNo,
      user: req.user?.id,
    };

    const insurance = await Insurance.findOneAndUpdate({ vehicleRegNo }, data, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    try {
      await syncInsuranceToLetters(insurance);
    } catch (syncErr) {
      console.error("Insurance upsert sync to letters failed:", syncErr);
    }

    res.json(insurance);
  } catch (error) {
    console.error("Error upserting insurance:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
