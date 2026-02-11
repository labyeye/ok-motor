const BuyLetter = require("../models/BuyLetter");
const Vehicle = require("../models/Vehicle");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  compressBuffer,
  uploadBufferToImageKit,
} = require("../utils/imageHelper");

const upload = multer();

// Support multipart form-data uploads for buy letters (documents/images)
exports.createBuyLetter = [
  upload.fields([
    { name: "vehicleRCFront" },
    { name: "vehicleRCBack" },
    { name: "aadhaarFront" },
    { name: "aadhaarBack" },
    { name: "panPhoto" },
    { name: "deliveryPhoto" },
    { name: "insuranceNOCFront" },
    { name: "insuranceNOCBack" },
    { name: "vehiclePhotos" },
  ]),
  async (req, res) => {
    try {
      const body = req.body || {};
      const buyLetterData = {
        ...body,
        user: req.user.id,
        visibility: body.visibility || "private",
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

      // Prepare file uploads: compress then upload to ImageKit
      const files = req.files || {};
      const uploadedUrls = {
        vehicleRC: { front: null, back: null },
        aadhaar: { front: null, back: null },
        pan: null,
        deliveryPhoto: null,
        insuranceNOC: { front: null, back: null },
        vehiclePhotos: [],
      };

      // Parse preserved documents from frontend (URLs that shouldn't be lost)
      let preservedDocs = {};
      if (body.preservedDocuments) {
        try {
          preservedDocs =
            typeof body.preservedDocuments === "string"
              ? JSON.parse(body.preservedDocuments)
              : body.preservedDocuments;
        } catch (e) {
          console.error("Failed to parse preservedDocuments:", e);
        }
      }

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
        } else if (preservedDocs.vehicleRCFront) {
          uploadedUrls.vehicleRC.front = preservedDocs.vehicleRCFront;
        }

        if (files.vehicleRCBack && files.vehicleRCBack[0]) {
          uploadedUrls.vehicleRC.back = await processFile(
            files.vehicleRCBack[0],
            "vehicle-rc-back",
          );
        } else if (preservedDocs.vehicleRCBack) {
          uploadedUrls.vehicleRC.back = preservedDocs.vehicleRCBack;
        }

        if (files.aadhaarFront && files.aadhaarFront[0]) {
          uploadedUrls.aadhaar.front = await processFile(
            files.aadhaarFront[0],
            "aadhaar-front",
          );
        } else if (preservedDocs.aadhaarFront) {
          uploadedUrls.aadhaar.front = preservedDocs.aadhaarFront;
        }

        if (files.aadhaarBack && files.aadhaarBack[0]) {
          uploadedUrls.aadhaar.back = await processFile(
            files.aadhaarBack[0],
            "aadhaar-back",
          );
        } else if (preservedDocs.aadhaarBack) {
          uploadedUrls.aadhaar.back = preservedDocs.aadhaarBack;
        }

        if (files.panPhoto && files.panPhoto[0]) {
          uploadedUrls.pan = await processFile(files.panPhoto[0], "pan-photo");
        } else if (preservedDocs.panPhoto) {
          uploadedUrls.pan = preservedDocs.panPhoto;
        }

        if (files.deliveryPhoto && files.deliveryPhoto[0]) {
          uploadedUrls.deliveryPhoto = await processFile(
            files.deliveryPhoto[0],
            "delivery-photo",
          );
        } else if (preservedDocs.deliveryPhoto) {
          uploadedUrls.deliveryPhoto = preservedDocs.deliveryPhoto;
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

        if (files.insuranceNOCFront && files.insuranceNOCFront[0]) {
          uploadedUrls.insuranceNOC.front = await processFile(
            files.insuranceNOCFront[0],
            "insurance-noc-front",
          );
        } else if (preservedDocs.insuranceNOCFront) {
          uploadedUrls.insuranceNOC.front = preservedDocs.insuranceNOCFront;
        }

        if (files.insuranceNOCBack && files.insuranceNOCBack[0]) {
          uploadedUrls.insuranceNOC.back = await processFile(
            files.insuranceNOCBack[0],
            "insurance-noc-back",
          );
        } else if (preservedDocs.insuranceNOCBack) {
          uploadedUrls.insuranceNOC.back = preservedDocs.insuranceNOCBack;
        }
      } catch (uploadErr) {
        console.error("Image upload failed, aborting create:", uploadErr);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }

      buyLetterData.documents = {
        vehicleRC: uploadedUrls.vehicleRC,
        vehicleRCUploadMode: body.vehicleRCUploadMode || "separate",
        aadhaar: uploadedUrls.aadhaar,
        aadhaarUploadMode: body.aadhaarUploadMode || "separate",
        pan: uploadedUrls.pan,
        deliveryPhoto: uploadedUrls.deliveryPhoto,
        insuranceNOC: uploadedUrls.insuranceNOC,
        insuranceNOCUploadMode: body.insuranceNOCUploadMode || "separate",
        vehiclePhotos: uploadedUrls.vehiclePhotos,
        meta: { uploadedAt: new Date(), uploader: req.user.id },
      };

      // If registrationNumber is provided, check for existing document to avoid duplicate-key errors
      const escapeRegExp = (string) =>
        string.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
      if (
        buyLetterData.registrationNumber &&
        String(buyLetterData.registrationNumber).trim()
      ) {
        const regex = new RegExp(
          `^${escapeRegExp(String(buyLetterData.registrationNumber).trim())}$`,
          "i",
        );
        const query = { registrationNumber: regex };

        // When editing (previousVersionId exists), exclude that document and its versions from duplicate check
        if (buyLetterData.previousVersionId) {
          query._id = { $ne: buyLetterData.previousVersionId };
          // Also exclude other versions of the same original document
          if (buyLetterData.originalDocumentId) {
            query.originalDocumentId = {
              $ne: buyLetterData.originalDocumentId,
            };
            query._id = {
              $nin: [
                buyLetterData.previousVersionId,
                buyLetterData.originalDocumentId,
              ],
            };
          }
        }

        const existing = await BuyLetter.findOne(query);
        if (existing) {
          // Return conflict with existing document so frontend can reuse it
          return res.status(409).json({
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
      if (
        error &&
        (error.code === 11000 || error.name === "MongoServerError")
      ) {
        const dupKey = error.keyValue || {};
        return res.status(409).json({
          message: "Duplicate key error",
          dupKey,
          error: error.message,
        });
      }

      res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  },
];

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
      .populate("vehicle")
      .populate(
        "previousVersionId",
        "sellerName sellerFatherName sellerCurrentAddress selleraadhar sellerpan selleraadharphone selleraadharphone2 vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition buyerName buyerFatherName buyerCurrentAddress buyernames buyerphone witnessname witnessphone dealername dealeraddress returnpersonname saleDate saleTime saleAmount paymentMethod todayDate todayTime note documents",
      )
      .lean();

    // Rename populated field for frontend convenience
    const buyLettersWithPrevious = buyLetters.map((letter) => ({
      ...letter,
      previousVersion: letter.previousVersionId,
    }));

    const total = await BuyLetter.countDocuments(conditions);

    res.json({
      buyLetters: buyLettersWithPrevious,
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

    // Build update object: preserve saleDate unless explicitly provided
    const updateData = { ...req.body };
    if (!Object.prototype.hasOwnProperty.call(req.body, "saleDate")) {
      // ensure saleDate is not overwritten
      delete updateData.saleDate;
    } else if (req.body.saleDate) {
      // normalize provided saleDate
      updateData.saleDate = new Date(req.body.saleDate);
    }

    // Set edited metadata
    updateData.editedAt = new Date();
    updateData.editedBy = req.user.id;

    buyLetter = await BuyLetter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
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
