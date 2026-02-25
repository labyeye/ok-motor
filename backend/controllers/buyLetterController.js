const BuyLetter = require("../models/BuyLetter");
const Vehicle = require("../models/Vehicle");
const Insurance = require("../models/Insurance");
const PUC = require("../models/PUC");
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
    // support multiple pages/files for new documents
    { name: "insuranceCertificate", maxCount: 6 },
    { name: "vehicleNOC", maxCount: 6 },
    { name: "vehicleBuyReceipt", maxCount: 1 },
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

      // Upsert Insurance and PUC records based on registration number (mirror Sell behavior)
      const regNo = buyLetterData.registrationNumber;
      if (regNo) {
        try {
          const hasInsuranceFields =
            body.insuranceCompany ||
            body.insurancePolicyNumber ||
            body.insuranceExpiryDate ||
            body.insuranceStatus;

          if (hasInsuranceFields) {
            const insuranceData = {
              personName: body.sellerName || body.buyerName || "Unknown",
              personPhone: body.selleraadharphone || body.buyerPhone || "",
              personEmail: "",
              vehicleModel: body.vehicleModel || "",
              brand: body.vehicleName || "",
              year: "",
              regNo: regNo,
              vehicleRegNo: regNo,
              insurancePolicyNumber: body.insurancePolicyNumber,
              insuranceCompany: body.insuranceCompany,
              insuranceExpiryDate: body.insuranceExpiryDate
                ? new Date(body.insuranceExpiryDate)
                : undefined,
              insuranceStatus: body.insuranceStatus,
              user: req.user.id,
            };

            const insuranceDoc = await Insurance.findOneAndUpdate(
              { vehicleRegNo: new RegExp(`^${regNo}$`, "i") },
              insuranceData,
              {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
              },
            );

            if (insuranceDoc) {
              buyLetterData.insuranceId = insuranceDoc._id;
              buyLetterData.insuranceCompany = insuranceDoc.insuranceCompany;
              buyLetterData.insurancePolicyNumber =
                insuranceDoc.insurancePolicyNumber;
              buyLetterData.insuranceExpiryDate =
                insuranceDoc.insuranceExpiryDate;
              buyLetterData.insuranceStatus = insuranceDoc.insuranceStatus;
            }
          } else {
            const existingInsurance = await Insurance.findOne({
              vehicleRegNo: new RegExp(`^${regNo}$`, "i"),
            });
            if (existingInsurance) {
              buyLetterData.insuranceId = existingInsurance._id;
              buyLetterData.insuranceCompany =
                existingInsurance.insuranceCompany;
              buyLetterData.insurancePolicyNumber =
                existingInsurance.insurancePolicyNumber;
              buyLetterData.insuranceExpiryDate =
                existingInsurance.insuranceExpiryDate;
              buyLetterData.insuranceStatus = existingInsurance.insuranceStatus;
            }
          }
        } catch (e) {
          console.error("Insurance upsert/fetch failed (buy):", e);
        }

        try {
          const hasPUCFields =
            body.pucIssueDate || body.pucExpiryDate || body.pucStatus;

          if (hasPUCFields) {
            const pucData = {
              personName: body.sellerName || body.buyerName || "Unknown",
              personPhone: body.selleraadharphone || body.buyerPhone || "",
              personEmail: "",
              vehicleModel: body.vehicleModel || "",
              brand: body.vehicleName || "",
              year: "",
              regNo: regNo,
              vehicleRegNo: regNo,
              pucIssueDate: body.pucIssueDate
                ? new Date(body.pucIssueDate)
                : undefined,
              pucExpiryDate: body.pucExpiryDate
                ? new Date(body.pucExpiryDate)
                : undefined,
              pucStatus: body.pucStatus,
              user: req.user.id,
            };

            const pucDoc = await PUC.findOneAndUpdate(
              { vehicleRegNo: new RegExp(`^${regNo}$`, "i") },
              pucData,
              {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
              },
            );

            if (pucDoc) {
              buyLetterData.pucId = pucDoc._id;
              buyLetterData.pucIssueDate = pucDoc.pucIssueDate;
              buyLetterData.pucExpiryDate = pucDoc.pucExpiryDate;
              buyLetterData.pucStatus = pucDoc.pucStatus;
            }
          } else {
            const existingPUC = await PUC.findOne({
              vehicleRegNo: new RegExp(`^${regNo}$`, "i"),
            });
            if (existingPUC) {
              buyLetterData.pucId = existingPUC._id;
              buyLetterData.pucIssueDate = existingPUC.pucIssueDate;
              buyLetterData.pucExpiryDate = existingPUC.pucExpiryDate;
              buyLetterData.pucStatus = existingPUC.pucStatus;
            }
          }
        } catch (e) {
          console.error("PUC upsert/fetch failed (buy):", e);
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
        // new multi-page documents
        insuranceCertificate: { pages: [] },
        vehicleNOC: { pages: [] },
        vehicleBuyReceipt: { pages: [] },
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

      const { PDFDocument } = require("pdf-lib");

      const processImageFile = async (file, nameHint) => {
        const compressed = await compressBuffer(file.buffer, 100);
        const filename = `${Date.now()}-${nameHint}`;
        const uploaded = await uploadBufferToImageKit(
          compressed,
          filename,
          file.mimetype || "image/jpeg",
        );
        return uploaded.url;
      };

      // Generic single-file processor: accepts image or PDF and returns an upload URL.
      const processFile = async (file, nameHint) => {
        if (!file) return null;
        const isPdf =
          file.mimetype === "application/pdf" ||
          (file.originalname &&
            file.originalname.toLowerCase().endsWith(".pdf"));
        if (isPdf) {
          const filename = `${Date.now()}-${nameHint}.pdf`;
          const uploaded = await uploadBufferToImageKit(
            file.buffer,
            filename,
            "application/pdf",
          );
          return uploaded.url;
        }
        // fallback to image processing
        return await processImageFile(file, nameHint);
      };

      const processPdfFileToPages = async (file, nameHint) => {
        // Split multi-page PDF into single-page PDF buffers and upload each page separately
        const srcPdf = await PDFDocument.load(file.buffer);
        const pageUrls = [];
        for (let i = 0; i < srcPdf.getPageCount(); i++) {
          const newPdf = await PDFDocument.create();
          const [copied] = await newPdf.copyPages(srcPdf, [i]);
          newPdf.addPage(copied);
          const singlePageBytes = await newPdf.save();
          const filename = `${Date.now()}-${nameHint}-page-${i + 1}.pdf`;
          const uploaded = await uploadBufferToImageKit(
            Buffer.from(singlePageBytes),
            filename,
            "application/pdf",
          );
          pageUrls.push(uploaded.url);
        }
        return pageUrls;
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
        } else if (
          preservedDocs.vehiclePhotos &&
          Array.isArray(preservedDocs.vehiclePhotos)
        ) {
          uploadedUrls.vehiclePhotos = preservedDocs.vehiclePhotos;
        }

        // Handle multiple insuranceCertificate uploads (images or PDFs)
        if (files.insuranceCertificate && files.insuranceCertificate.length) {
          for (
            let i = 0;
            i < files.insuranceCertificate.length &&
            uploadedUrls.insuranceCertificate.pages.length < 200;
            i++
          ) {
            const f = files.insuranceCertificate[i];
            if (
              f.mimetype === "application/pdf" ||
              f.originalname?.toLowerCase().endsWith(".pdf")
            ) {
              const pageUrls = await processPdfFileToPages(
                f,
                `insurance-certificate-${i}`,
              );
              uploadedUrls.insuranceCertificate.pages.push(...pageUrls);
            } else {
              const url = await processImageFile(
                f,
                `insurance-certificate-${i}`,
              );
              uploadedUrls.insuranceCertificate.pages.push(url);
            }
          }
        } else if (
          preservedDocs.insuranceCertificate &&
          Array.isArray(preservedDocs.insuranceCertificate)
        ) {
          uploadedUrls.insuranceCertificate.pages =
            uploadedUrls.insuranceCertificate.pages.concat(
              preservedDocs.insuranceCertificate,
            );
        }

        // Handle multiple vehicleNOC uploads
        if (files.vehicleNOC && files.vehicleNOC.length) {
          for (
            let i = 0;
            i < files.vehicleNOC.length &&
            uploadedUrls.vehicleNOC.pages.length < 200;
            i++
          ) {
            const f = files.vehicleNOC[i];
            if (
              f.mimetype === "application/pdf" ||
              f.originalname?.toLowerCase().endsWith(".pdf")
            ) {
              const pageUrls = await processPdfFileToPages(
                f,
                `vehicle-noc-${i}`,
              );
              uploadedUrls.vehicleNOC.pages.push(...pageUrls);
            } else {
              const url = await processImageFile(f, `vehicle-noc-${i}`);
              uploadedUrls.vehicleNOC.pages.push(url);
            }
          }
        } else if (
          preservedDocs.vehicleNOC &&
          Array.isArray(preservedDocs.vehicleNOC)
        ) {
          uploadedUrls.vehicleNOC.pages = uploadedUrls.vehicleNOC.pages.concat(
            preservedDocs.vehicleNOC,
          );
        }

        // Handle multiple vehicleBuyReceipt uploads
        if (files.vehicleBuyReceipt && files.vehicleBuyReceipt.length) {
          for (
            let i = 0;
            i < files.vehicleBuyReceipt.length &&
            uploadedUrls.vehicleBuyReceipt.pages.length < 200;
            i++
          ) {
            const f = files.vehicleBuyReceipt[i];
            if (
              f.mimetype === "application/pdf" ||
              f.originalname?.toLowerCase().endsWith(".pdf")
            ) {
              const pageUrls = await processPdfFileToPages(
                f,
                `vehicle-buy-receipt-${i}`,
              );
              uploadedUrls.vehicleBuyReceipt.pages.push(...pageUrls);
            } else {
              const url = await processImageFile(f, `vehicle-buy-receipt-${i}`);
              uploadedUrls.vehicleBuyReceipt.pages.push(url);
            }
          }
        } else if (
          preservedDocs.vehicleBuyReceipt &&
          Array.isArray(preservedDocs.vehicleBuyReceipt)
        ) {
          uploadedUrls.vehicleBuyReceipt.pages =
            uploadedUrls.vehicleBuyReceipt.pages.concat(
              preservedDocs.vehicleBuyReceipt,
            );
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
        insuranceCertificate: uploadedUrls.insuranceCertificate,
        insuranceCertificateUploadMode:
          body.insuranceCertificateUploadMode || "separate",
        vehicleNOC: uploadedUrls.vehicleNOC,
        vehicleNOCUploadMode: body.vehicleNOCUploadMode || "separate",
        vehicleBuyReceipt: uploadedUrls.vehicleBuyReceipt,
        vehicleBuyReceiptUploadMode:
          body.vehicleBuyReceiptUploadMode || "separate",
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

    // Auto-save / upsert Insurance and PUC master records when BuyLetter is updated
    try {
      const regNo =
        updateData.registrationNumber || buyLetter.registrationNumber;
      if (regNo) {
        const regRegex = new RegExp(`^${String(regNo).trim()}$`, "i");

        const hasInsuranceFields =
          updateData.insuranceCompany ||
          updateData.insurancePolicyNumber ||
          updateData.insuranceExpiryDate ||
          updateData.insuranceStatus;
        if (hasInsuranceFields) {
          const insuranceData = {
            personName:
              updateData.sellerName || buyLetter.sellerName || "Unknown",
            personPhone:
              updateData.selleraadharphone || buyLetter.selleraadharphone || "",
            personEmail: "",
            vehicleModel:
              updateData.vehicleModel || buyLetter.vehicleModel || "",
            brand: updateData.vehicleName || buyLetter.vehicleName || "",
            year: "",
            regNo: regNo,
            vehicleRegNo: regNo,
            insuranceCompany: updateData.insuranceCompany,
            insurancePolicyNumber: updateData.insurancePolicyNumber,
            insuranceExpiryDate: updateData.insuranceExpiryDate
              ? new Date(updateData.insuranceExpiryDate)
              : undefined,
            insuranceStatus: updateData.insuranceStatus,
            user: req.user.id,
          };

          const insuranceDoc = await Insurance.findOneAndUpdate(
            { vehicleRegNo: regRegex },
            insuranceData,
            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            },
          );

          if (insuranceDoc) {
            updateData.insuranceId = insuranceDoc._id;
          }
        }

        const hasPUCFields =
          updateData.pucIssueDate ||
          updateData.pucExpiryDate ||
          updateData.pucStatus;
        if (hasPUCFields) {
          const pucData = {
            personName:
              updateData.sellerName || buyLetter.sellerName || "Unknown",
            personPhone:
              updateData.selleraadharphone || buyLetter.selleraadharphone || "",
            personEmail: "",
            vehicleModel:
              updateData.vehicleModel || buyLetter.vehicleModel || "",
            brand: updateData.vehicleName || buyLetter.vehicleName || "",
            year: "",
            regNo: regNo,
            vehicleRegNo: regNo,
            pucIssueDate: updateData.pucIssueDate
              ? new Date(updateData.pucIssueDate)
              : undefined,
            pucExpiryDate: updateData.pucExpiryDate
              ? new Date(updateData.pucExpiryDate)
              : undefined,
            pucStatus: updateData.pucStatus,
            user: req.user.id,
          };

          const pucDoc = await PUC.findOneAndUpdate(
            { vehicleRegNo: regRegex },
            pucData,
            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            },
          );

          if (pucDoc) {
            updateData.pucId = pucDoc._id;
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync Insurance/PUC on buy update:", e);
    }

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
