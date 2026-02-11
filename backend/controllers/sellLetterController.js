const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");
const Vehicle = require("../models/Vehicle");
const Insurance = require("../models/Insurance");
const PUC = require("../models/PUC");
const multer = require("multer");
const {
  compressBuffer,
  uploadBufferToImageKit,
} = require("../utils/imageHelper");

const upload = multer();

// New create handler which handles multipart form-data for images.
exports.createSellLetter = [
  upload.fields([
    { name: "vehicleRCFront" },
    { name: "vehicleRCBack" },
    { name: "aadhaarFront" },
    { name: "aadhaarBack" },
    { name: "panPhoto" },
    { name: "deliveryPhoto" },
    { name: "vehiclePhotos" },
  ]),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user" });
      }

      const bodyData = req.body || {};
      const sellLetterData = {
        ...bodyData,
        user: req.user.id,
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
          sellLetterData.vehiclekm = vehicle.kilometersRun?.toString() || "";
          sellLetterData.vehicleCondition = vehicle.vehicleCondition;
        }
      }

      // Upsert Insurance and PUC records based on registration number so
      // Sell acts only as a reference to the master records.
      const regNo = sellLetterData.registrationNumber;
      if (regNo) {
        try {
          // Insurance: if insurance fields submitted, upsert; otherwise attach existing insurance if any
          const hasInsuranceFields =
            bodyData.insuranceCompany ||
            bodyData.insurancePolicyNumber ||
            bodyData.insuranceExpiryDate ||
            bodyData.insuranceStatus;

          if (hasInsuranceFields) {
            const insuranceData = {
              vehicleRegNo: regNo,
              insuranceCompany: bodyData.insuranceCompany,
              insurancePolicyNumber: bodyData.insurancePolicyNumber,
              insuranceExpiryDate: bodyData.insuranceExpiryDate
                ? new Date(bodyData.insuranceExpiryDate)
                : undefined,
              insuranceStatus: bodyData.insuranceStatus,
            };

            const insuranceDoc = await Insurance.findOneAndUpdate(
              { vehicleRegNo: regNo },
              insuranceData,
              { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
            );

            if (insuranceDoc) {
              sellLetterData.insuranceId = insuranceDoc._id;
              sellLetterData.insuranceCompany = insuranceDoc.insuranceCompany;
              sellLetterData.insurancePolicyNumber = insuranceDoc.insurancePolicyNumber;
              sellLetterData.insuranceExpiryDate = insuranceDoc.insuranceExpiryDate;
              sellLetterData.insuranceStatus = insuranceDoc.insuranceStatus;
            }
          } else {
            const existingInsurance = await Insurance.findOne({ vehicleRegNo: new RegExp(`^${regNo}$`, "i") });
            if (existingInsurance) {
              sellLetterData.insuranceId = existingInsurance._id;
              sellLetterData.insuranceCompany = existingInsurance.insuranceCompany;
              sellLetterData.insurancePolicyNumber = existingInsurance.insurancePolicyNumber;
              sellLetterData.insuranceExpiryDate = existingInsurance.insuranceExpiryDate;
              sellLetterData.insuranceStatus = existingInsurance.insuranceStatus;
            }
          }
        } catch (e) {
          console.error("Insurance upsert/fetch failed:", e);
        }

        try {
          // PUC: same logic as insurance
          const hasPUCFields = bodyData.pucIssueDate || bodyData.pucExpiryDate || bodyData.pucStatus;

          if (hasPUCFields) {
            const pucData = {
              vehicleRegNo: regNo,
              pucIssueDate: bodyData.pucIssueDate ? new Date(bodyData.pucIssueDate) : undefined,
              pucExpiryDate: bodyData.pucExpiryDate ? new Date(bodyData.pucExpiryDate) : undefined,
              pucStatus: bodyData.pucStatus,
            };

            const pucDoc = await PUC.findOneAndUpdate(
              { vehicleRegNo: regNo },
              pucData,
              { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
            );

            if (pucDoc) {
              sellLetterData.pucId = pucDoc._id;
              sellLetterData.pucIssueDate = pucDoc.pucIssueDate;
              sellLetterData.pucExpiryDate = pucDoc.pucExpiryDate;
              sellLetterData.pucStatus = pucDoc.pucStatus;
            }
          } else {
            const existingPUC = await PUC.findOne({ vehicleRegNo: new RegExp(`^${regNo}$`, "i") });
            if (existingPUC) {
              sellLetterData.pucId = existingPUC._id;
              sellLetterData.pucIssueDate = existingPUC.pucIssueDate;
              sellLetterData.pucExpiryDate = existingPUC.pucExpiryDate;
              sellLetterData.pucStatus = existingPUC.pucStatus;
            }
          }
        } catch (e) {
          console.error("PUC upsert/fetch failed:", e);
        }
      }

      // Prepare file uploads: compress then upload to ImageKit
      const files = req.files || {};
      const uploadedUrls = {
        vehicleRC: { front: null, back: null },
        aadhaar: { front: null, back: null },
        pan: null,
        deliveryPhoto: null,
        vehiclePhotos: [],
      };

      // helper to process single file
      const processFile = async (file, nameHint) => {
        const compressed = await compressBuffer(file.buffer, 100);
        const filename = `${Date.now()}-${nameHint}`;
        const uploaded = await uploadBufferToImageKit(compressed, filename);
        return uploaded.url;
      };

      try {
        if (files.vehicleRCFront && files.vehicleRCFront[0]) {
          uploadedUrls.vehicleRC.front = await processFile(
            files.vehicleRCFront[0],
            "vehicle-rc-front",
          );
        }
        if (files.vehicleRCBack && files.vehicleRCBack[0]) {
          uploadedUrls.vehicleRC.back = await processFile(
            files.vehicleRCBack[0],
            "vehicle-rc-back",
          );
        }
        if (files.aadhaarFront && files.aadhaarFront[0]) {
          uploadedUrls.aadhaar.front = await processFile(
            files.aadhaarFront[0],
            "aadhaar-front",
          );
        }
        if (files.aadhaarBack && files.aadhaarBack[0]) {
          uploadedUrls.aadhaar.back = await processFile(
            files.aadhaarBack[0],
            "aadhaar-back",
          );
        }
        if (files.panPhoto && files.panPhoto[0]) {
          uploadedUrls.pan = await processFile(files.panPhoto[0], "pan-photo");
        }
        if (files.deliveryPhoto && files.deliveryPhoto[0]) {
          uploadedUrls.deliveryPhoto = await processFile(
            files.deliveryPhoto[0],
            "delivery-photo",
          );
        }
        if (files.vehiclePhotos && files.vehiclePhotos.length) {
          for (let i = 0; i < files.vehiclePhotos.length && i < 10; i++) {
            const url = await processFile(
              files.vehiclePhotos[i],
              `vehicle-photo-${i}`,
            );
            uploadedUrls.vehiclePhotos.push(url);
          }
        }
      } catch (uploadErr) {
        console.error("Image upload failed, aborting create:", uploadErr);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }

      sellLetterData.documents = {
        vehicleRC: uploadedUrls.vehicleRC,
        vehicleRCUploadMode: bodyData.vehicleRCUploadMode || "separate",
        aadhaar: uploadedUrls.aadhaar,
        aadhaarUploadMode: bodyData.aadhaarUploadMode || "separate",
        pan: uploadedUrls.pan,
        deliveryPhoto: uploadedUrls.deliveryPhoto,
        vehiclePhotos: uploadedUrls.vehiclePhotos,
        meta: { uploadedAt: new Date(), uploader: req.user.id },
      };

      const sellLetter = new SellLetter(sellLetterData);
      const savedSellLetter = await sellLetter.save();

      res.status(201).json(savedSellLetter);
    } catch (error) {
      console.error("Detailed error creating sell letter:", error);
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ message: "Validation Error", errors: error.errors });
      }
      if (error.name === "CastError") {
        return res
          .status(400)
          .json({ message: "Invalid value provided", error: error.message });
      }
      if (error.code && error.code === 11000) {
        return res
          .status(409)
          .json({ message: "Duplicate key error", error: error.keyValue });
      }
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
];

exports.getVehicleDetails = async (req, res) => {
  try {
    const { registrationNumber } = req.query;

    if (!registrationNumber) {
      return res.status(400).json({
        message: "Registration number is required",
      });
    }

    const [buyLetters, sellLetters, vehicles] = await Promise.all([
      BuyLetter.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        $or: [
          { user: req.user.id },
          { visibility: "staff" },
          ...(req.user.role === "staff" || req.user.role === "admin"
            ? [{}]
            : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(1),

      SellLetter.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        $or: [
          { user: req.user.id },
          { visibility: "staff" },
          ...(req.user.role === "staff" || req.user.role === "admin"
            ? [{}]
            : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(1),

      Vehicle.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(1),
    ]);

    // Prefer most-recent SellLetter for buyer details, then BuyLetter, then Vehicle
    const vehicleRecord = sellLetters[0] || buyLetters[0] || vehicles[0];

    if (!vehicleRecord) {
      return res.status(404).json({
        message: "No vehicle found with this registration number",
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

    // Try to include brand and year where available. Prefer explicit fields
    // from Vehicle, then fall back to other sources.
    vehicleDetails.brand =
      vehicleRecord.brand ||
      (vehicleRecord.vehicleName ? vehicleRecord.vehicleName.split(" ")[0] : undefined);

    vehicleDetails.year =
      vehicleRecord.manufacturingYear || vehicleRecord.year || vehicleRecord.year || undefined;

    // If the found record is a SellLetter it may contain PUC/Insurance information
    // and buyer contact details. Copy those fields when present.
    if (vehicleRecord.pucIssueDate)
      vehicleDetails.pucIssueDate = vehicleRecord.pucIssueDate;
    if (vehicleRecord.pucExpiryDate)
      vehicleDetails.pucExpiryDate = vehicleRecord.pucExpiryDate;
    if (vehicleRecord.pucStatus)
      vehicleDetails.pucStatus = vehicleRecord.pucStatus;
    if (vehicleRecord.insuranceStatus)
      vehicleDetails.insuranceStatus = vehicleRecord.insuranceStatus;
    if (vehicleRecord.insuranceExpiryDate)
      vehicleDetails.insuranceExpiryDate = vehicleRecord.insuranceExpiryDate;
    if (vehicleRecord.insuranceCompany)
      vehicleDetails.insuranceCompany = vehicleRecord.insuranceCompany;
    if (vehicleRecord.insurancePolicyNumber)
      vehicleDetails.insurancePolicyNumber =
        vehicleRecord.insurancePolicyNumber;

    // Buyer contact details from SellLetter
    if (vehicleRecord.buyerName) vehicleDetails.personName = vehicleRecord.buyerName;
    if (vehicleRecord.buyerPhone) vehicleDetails.personPhone = vehicleRecord.buyerPhone;
    if (vehicleRecord.buyerEmail) vehicleDetails.personEmail = vehicleRecord.buyerEmail;

    res.json(vehicleDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getSellLetters = async (req, res) => {
  try {
    const sellLetters = await SellLetter.find()
      .sort({ createdAt: -1 })
      .select("-__v")
      .populate("user", "name role")
      .populate(
        "previousVersionId",
        "vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition pucIssueDate pucExpiryDate pucStatus insuranceStatus insuranceExpiryDate insuranceCompany insurancePolicyNumber buyerName buyerFatherName buyerAddress buyerPhone buyerPhone2 buyerEmail buyerAadhar saleDate saleTime saleAmount paymentMethod todayDate todayTime previousDate previousTime witnessName witnessPhone note documents",
      )
      .lean();

    // Rename populated field for frontend convenience
    const sellLettersWithPrevious = sellLetters.map((letter) => ({
      ...letter,
      previousVersion: letter.previousVersionId,
    }));

    res.json(sellLettersWithPrevious);
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
      .populate("user", "name role");

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
      .populate("user", "name role")
      .populate(
        "previousVersionId",
        "vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition pucIssueDate pucExpiryDate pucStatus insuranceStatus insuranceExpiryDate insuranceCompany insurancePolicyNumber buyerName buyerFatherName buyerAddress buyerPhone buyerPhone2 buyerEmail buyerAadhar saleDate saleTime saleAmount paymentMethod todayDate todayTime previousDate previousTime witnessName witnessPhone note documents",
      )
      .lean();

    // Rename populated field for frontend convenience
    const sellLettersWithPrevious = sellLetters.map((letter) => ({
      ...letter,
      previousVersion: letter.previousVersionId,
    }));

    res.json(sellLettersWithPrevious);
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
        { visibility: "staff" },

        ...(req.user.role === "staff" ? [{}] : []),
      ],
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

    // Build update object: preserve saleDate unless explicitly provided
    const updateData = { ...req.body };
    if (!Object.prototype.hasOwnProperty.call(req.body, "saleDate")) {
      delete updateData.saleDate;
    } else if (req.body.saleDate) {
      updateData.saleDate = new Date(req.body.saleDate);
    }

    // Set edited metadata
    updateData.editedAt = new Date();
    updateData.editedBy = req.user && req.user.id ? req.user.id : undefined;

    const updated = await SellLetter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
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
