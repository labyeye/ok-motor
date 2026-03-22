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
              insuranceExpiry: body.insuranceExpiryDate
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
            body.pucIssueDate || body.pucExpiryDate || body.pucExpiry || body.pucStatus;

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
              pucExpiryDate: (body.pucExpiryDate || body.pucExpiry)
                ? new Date(body.pucExpiryDate || body.pucExpiry)
                : undefined,
              pucExpiry: (body.pucExpiryDate || body.pucExpiry)
                ? new Date(body.pucExpiryDate || body.pucExpiry)
                : undefined,
              pucStatus: body.pucStatus,
              user: req.user.id,
            };

            const pucDoc = await PUC.findOneAndUpdate(
              {
                $or: [
                  { vehicleRegNo: new RegExp(`^${regNo}$`, "i") },
                  { regNo: new RegExp(`^${regNo}$`, "i") },
                ],
              },
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
              buyLetterData.pucExpiryDate =
                pucDoc.pucExpiryDate || pucDoc.pucExpiry;
              buyLetterData.pucStatus = pucDoc.pucStatus;
            }
          } else {
            const existingPUC = await PUC.findOne({
              $or: [
                { vehicleRegNo: new RegExp(`^${regNo}$`, "i") },
                { regNo: new RegExp(`^${regNo}$`, "i") },
              ],
            });
            if (existingPUC) {
              buyLetterData.pucId = existingPUC._id;
              buyLetterData.pucIssueDate = existingPUC.pucIssueDate;
              buyLetterData.pucExpiryDate =
                existingPUC.pucExpiryDate || existingPUC.pucExpiry;
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

      // existingDocuments is the full previous documents object sent as ultimate fallback
      let existingDocuments = null;
      if (body.existingDocuments) {
        try {
          existingDocuments =
            typeof body.existingDocuments === "string"
              ? JSON.parse(body.existingDocuments)
              : body.existingDocuments;
        } catch (e) {
          console.error("Failed to parse existingDocuments:", e);
        }
      }

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

      // If individual preservedDocs keys are empty but we have existingDocuments,
      // populate preservedDocs from existingDocuments as a safe fallback
      if (existingDocuments && Object.keys(preservedDocs).length === 0) {
        const ed = existingDocuments;
        if (ed.vehicleRC?.front) preservedDocs.vehicleRCFront = ed.vehicleRC.front;
        if (ed.vehicleRC?.back)  preservedDocs.vehicleRCBack  = ed.vehicleRC.back;
        if (ed.aadhaar?.front)   preservedDocs.aadhaarFront   = ed.aadhaar.front;
        if (ed.aadhaar?.back)    preservedDocs.aadhaarBack    = ed.aadhaar.back;
        if (ed.pan)              preservedDocs.panPhoto        = ed.pan;
        if (ed.deliveryPhoto)    preservedDocs.deliveryPhoto   = ed.deliveryPhoto;
        if (ed.vehiclePhotos?.length)                         preservedDocs.vehiclePhotos          = ed.vehiclePhotos;
        if (ed.insuranceCertificate?.pages?.length)           preservedDocs.insuranceCertificate   = ed.insuranceCertificate.pages;
        if (ed.vehicleNOC?.pages?.length)                     preservedDocs.vehicleNOC             = ed.vehicleNOC.pages;
        if (ed.vehicleBuyReceipt?.pages?.length)              preservedDocs.vehicleBuyReceipt      = ed.vehicleBuyReceipt.pages;
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
        // Split multi-page PDF into single-page PDF buffers and upload each page in parallel
        const srcPdf = await PDFDocument.load(file.buffer);
        const pageCount = srcPdf.getPageCount();
        const pageBuffers = await Promise.all(
          Array.from({ length: pageCount }, async (_, i) => {
            const newPdf = await PDFDocument.create();
            const [copied] = await newPdf.copyPages(srcPdf, [i]);
            newPdf.addPage(copied);
            const bytes = await newPdf.save();
            return { buf: Buffer.from(bytes), index: i };
          }),
        );
        const pageUrls = await Promise.all(
          pageBuffers.map(({ buf, index }) => {
            const filename = `${Date.now()}-${nameHint}-page-${index + 1}.pdf`;
            return uploadBufferToImageKit(buf, filename, "application/pdf").then(
              (u) => u.url,
            );
          }),
        );
        return pageUrls;
      };

      try {
        // Helper: process a multi-file group (images or PDFs) in parallel, keeping order
        const processMultiFileGroup = async (fileList, namePrefix, limit = 200) => {
          if (!fileList || !fileList.length) return [];
          const capped = fileList.slice(0, limit);
          const results = await Promise.all(
            capped.map((f, i) => {
              const isPdf =
                f.mimetype === "application/pdf" ||
                f.originalname?.toLowerCase().endsWith(".pdf");
              return isPdf
                ? processPdfFileToPages(f, `${namePrefix}-${i}`)
                : processImageFile(f, `${namePrefix}-${i}`).then((u) => [u]);
            }),
          );
          // flatten: processPdfFileToPages returns array, processImageFile returns single url wrapped above
          return results.flat();
        };

        // Run all single-file uploads in parallel
        const [rcFront, rcBack, aadhaarFront, aadhaarBack, pan, delivery] =
          await Promise.all([
            files.vehicleRCFront?.[0]
              ? processFile(files.vehicleRCFront[0], "vehicle-rc-front")
              : Promise.resolve(preservedDocs.vehicleRCFront || null),
            files.vehicleRCBack?.[0]
              ? processFile(files.vehicleRCBack[0], "vehicle-rc-back")
              : Promise.resolve(preservedDocs.vehicleRCBack || null),
            files.aadhaarFront?.[0]
              ? processFile(files.aadhaarFront[0], "aadhaar-front")
              : Promise.resolve(preservedDocs.aadhaarFront || null),
            files.aadhaarBack?.[0]
              ? processFile(files.aadhaarBack[0], "aadhaar-back")
              : Promise.resolve(preservedDocs.aadhaarBack || null),
            files.panPhoto?.[0]
              ? processFile(files.panPhoto[0], "pan-photo")
              : Promise.resolve(preservedDocs.panPhoto || null),
            files.deliveryPhoto?.[0]
              ? processFile(files.deliveryPhoto[0], "delivery-photo")
              : Promise.resolve(preservedDocs.deliveryPhoto || null),
          ]);

        uploadedUrls.vehicleRC.front = rcFront;
        uploadedUrls.vehicleRC.back = rcBack;
        uploadedUrls.aadhaar.front = aadhaarFront;
        uploadedUrls.aadhaar.back = aadhaarBack;
        uploadedUrls.pan = pan;
        uploadedUrls.deliveryPhoto = delivery;

        // Run all multi-file group uploads in parallel
        const [vehiclePhotos, insuranceCertPages, nocPages, buyReceiptPages] =
          await Promise.all([
            files.vehiclePhotos?.length
              ? Promise.all(
                  files.vehiclePhotos.slice(0, 10).map((f, i) =>
                    processFile(f, `vehicle-photo-${i}`),
                  ),
                )
              : Promise.resolve(
                  preservedDocs.vehiclePhotos && Array.isArray(preservedDocs.vehiclePhotos)
                    ? preservedDocs.vehiclePhotos
                    : [],
                ),
            files.insuranceCertificate?.length
              ? processMultiFileGroup(files.insuranceCertificate, "insurance-certificate", 200)
              : Promise.resolve(
                  preservedDocs.insuranceCertificate && Array.isArray(preservedDocs.insuranceCertificate)
                    ? preservedDocs.insuranceCertificate
                    : [],
                ),
            files.vehicleNOC?.length
              ? processMultiFileGroup(files.vehicleNOC, "vehicle-noc", 200)
              : Promise.resolve(
                  preservedDocs.vehicleNOC && Array.isArray(preservedDocs.vehicleNOC)
                    ? preservedDocs.vehicleNOC
                    : [],
                ),
            files.vehicleBuyReceipt?.length
              ? processMultiFileGroup(files.vehicleBuyReceipt, "vehicle-buy-receipt", 200)
              : Promise.resolve(
                  preservedDocs.vehicleBuyReceipt && Array.isArray(preservedDocs.vehicleBuyReceipt)
                    ? preservedDocs.vehicleBuyReceipt
                    : [],
                ),
          ]);

        uploadedUrls.vehiclePhotos = vehiclePhotos;
        uploadedUrls.insuranceCertificate.pages = insuranceCertPages;
        uploadedUrls.vehicleNOC.pages = nocPages;
        uploadedUrls.vehicleBuyReceipt.pages = buyReceiptPages;
      } catch (uploadErr) {
        console.error("Image upload failed, aborting create:", uploadErr);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }

      // Final fallback: if existingDocuments was provided, restore any field that is still null
      if (existingDocuments) {
        const ed = existingDocuments;
        if (!uploadedUrls.vehicleRC.front && ed.vehicleRC?.front)  uploadedUrls.vehicleRC.front = ed.vehicleRC.front;
        if (!uploadedUrls.vehicleRC.back  && ed.vehicleRC?.back)   uploadedUrls.vehicleRC.back  = ed.vehicleRC.back;
        if (!uploadedUrls.aadhaar.front   && ed.aadhaar?.front)    uploadedUrls.aadhaar.front   = ed.aadhaar.front;
        if (!uploadedUrls.aadhaar.back    && ed.aadhaar?.back)     uploadedUrls.aadhaar.back    = ed.aadhaar.back;
        if (!uploadedUrls.pan             && ed.pan)               uploadedUrls.pan             = ed.pan;
        if (!uploadedUrls.deliveryPhoto   && ed.deliveryPhoto)     uploadedUrls.deliveryPhoto   = ed.deliveryPhoto;
        if (!uploadedUrls.vehiclePhotos?.length && ed.vehiclePhotos?.length)
          uploadedUrls.vehiclePhotos = ed.vehiclePhotos;
        if (!uploadedUrls.insuranceCertificate.pages?.length && ed.insuranceCertificate?.pages?.length)
          uploadedUrls.insuranceCertificate.pages = ed.insuranceCertificate.pages;
        if (!uploadedUrls.vehicleNOC.pages?.length && ed.vehicleNOC?.pages?.length)
          uploadedUrls.vehicleNOC.pages = ed.vehicleNOC.pages;
        if (!uploadedUrls.vehicleBuyReceipt.pages?.length && ed.vehicleBuyReceipt?.pages?.length)
          uploadedUrls.vehicleBuyReceipt.pages = ed.vehicleBuyReceipt.pages;
      }

      buyLetterData.documents = {
        vehicleRC: uploadedUrls.vehicleRC,
        vehicleRCUploadMode: body.vehicleRCUploadMode || existingDocuments?.vehicleRCUploadMode || "separate",
        aadhaar: uploadedUrls.aadhaar,
        aadhaarUploadMode: body.aadhaarUploadMode || existingDocuments?.aadhaarUploadMode || "separate",
        pan: uploadedUrls.pan,
        deliveryPhoto: uploadedUrls.deliveryPhoto,
        insuranceCertificate: uploadedUrls.insuranceCertificate,
        insuranceCertificateUploadMode:
          body.insuranceCertificateUploadMode || existingDocuments?.insuranceCertificateUploadMode || "separate",
        vehicleNOC: uploadedUrls.vehicleNOC,
        vehicleNOCUploadMode: body.vehicleNOCUploadMode || existingDocuments?.vehicleNOCUploadMode || "separate",
        vehicleBuyReceipt: uploadedUrls.vehicleBuyReceipt,
        vehicleBuyReceiptUploadMode:
          body.vehicleBuyReceiptUploadMode || existingDocuments?.vehicleBuyReceiptUploadMode || "separate",
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
      .populate("pucId", "pucIssueDate pucExpiryDate pucExpiry pucStatus pucNumber vehicleRegNo regNo")
      .populate("insuranceId", "insuranceCompany insurancePolicyNumber insurancePolicyNo insuranceExpiryDate insuranceExpiry insuranceStatus vehicleRegNo regNo")
      .populate(
        "previousVersionId",
        "sellerName sellerFatherName sellerCurrentAddress selleraadhar sellerpan selleraadharphone selleraadharphone2 vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition buyerName buyerFatherName buyerCurrentAddress buyernames buyerphone witnessname witnessphone dealername dealeraddress returnpersonname saleDate saleTime saleAmount paymentMethod todayDate todayTime note documents",
      )
      .lean();

    // Merge live PUC/Insurance data from populated master records over the stale inline fields
    const buyLettersWithPrevious = buyLetters.map((letter) => {
      const merged = { ...letter, previousVersion: letter.previousVersionId };
      if (letter.pucId && typeof letter.pucId === "object") {
        const p = letter.pucId;
        merged.pucIssueDate = p.pucIssueDate ?? merged.pucIssueDate;
        merged.pucExpiryDate = p.pucExpiryDate ?? p.pucExpiry ?? merged.pucExpiryDate;
        merged.pucStatus = p.pucStatus ?? merged.pucStatus;
      }
      if (letter.insuranceId && typeof letter.insuranceId === "object") {
        const i = letter.insuranceId;
        merged.insuranceCompany = i.insuranceCompany ?? merged.insuranceCompany;
        merged.insurancePolicyNumber = i.insurancePolicyNumber ?? i.insurancePolicyNo ?? merged.insurancePolicyNumber;
        merged.insuranceExpiryDate = i.insuranceExpiryDate ?? i.insuranceExpiry ?? merged.insuranceExpiryDate;
        merged.insuranceStatus = i.insuranceStatus ?? merged.insuranceStatus;
      }
      return merged;
    });

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
    })
      .populate("pucId", "pucIssueDate pucExpiryDate pucExpiry pucStatus pucNumber vehicleRegNo regNo")
      .populate("insuranceId", "insuranceCompany insurancePolicyNumber insurancePolicyNo insuranceExpiryDate insuranceExpiry insuranceStatus vehicleRegNo regNo")
      .lean();

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    // Overlay live PUC/Insurance master data over stale inline copies
    const result = { ...buyLetter };
    if (buyLetter.pucId && typeof buyLetter.pucId === "object") {
      const p = buyLetter.pucId;
      result.pucIssueDate = p.pucIssueDate ?? result.pucIssueDate;
      result.pucExpiryDate = p.pucExpiryDate ?? p.pucExpiry ?? result.pucExpiryDate;
      result.pucStatus = p.pucStatus ?? result.pucStatus;
    }
    if (buyLetter.insuranceId && typeof buyLetter.insuranceId === "object") {
      const i = buyLetter.insuranceId;
      result.insuranceCompany = i.insuranceCompany ?? result.insuranceCompany;
      result.insurancePolicyNumber = i.insurancePolicyNumber ?? i.insurancePolicyNo ?? result.insurancePolicyNumber;
      result.insuranceExpiryDate = i.insuranceExpiryDate ?? i.insuranceExpiry ?? result.insuranceExpiryDate;
      result.insuranceStatus = i.insuranceStatus ?? result.insuranceStatus;
    }

    res.json(result);
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
          updateData.pucExpiry ||
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
            pucExpiryDate: (updateData.pucExpiryDate || updateData.pucExpiry)
              ? new Date(updateData.pucExpiryDate || updateData.pucExpiry)
              : undefined,
            pucExpiry: (updateData.pucExpiryDate || updateData.pucExpiry)
              ? new Date(updateData.pucExpiryDate || updateData.pucExpiry)
              : undefined,
            pucStatus: updateData.pucStatus,
            user: req.user.id,
          };

          const pucDoc = await PUC.findOneAndUpdate(
            { $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }] },
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
