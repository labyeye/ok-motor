const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");
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

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const hasArray = (value) => Array.isArray(value) && value.length > 0;

const mergeMissingBuyDocumentsFromSell = (target, source) => {
  if (!target || !source) return target;

  const merged = {
    ...target,
    vehicleRC: { ...(target.vehicleRC || {}) },
  };

  if (!hasText(merged.vehicleRC.front) && hasText(source.vehicleRC?.front)) {
    merged.vehicleRC.front = source.vehicleRC.front;
  }
  if (!hasText(merged.vehicleRC.back) && hasText(source.vehicleRC?.back)) {
    merged.vehicleRC.back = source.vehicleRC.back;
  }

  return merged;
};

const syncMissingBuyDocsFromSellLetter = async ({
  regRegex,
  sellDocuments,
}) => {
  if (!regRegex || !sellDocuments) return;

  const buyLetter = await BuyLetter.findOne({
    registrationNumber: regRegex,
  })
    .sort({ createdAt: -1 })
    .select("documents")
    .lean();

  if (!buyLetter?.documents) return;

  const mergedDocuments = mergeMissingBuyDocumentsFromSell(
    buyLetter.documents,
    sellDocuments,
  );

  await BuyLetter.updateOne(
    { registrationNumber: regRegex },
    { $set: { documents: mergedDocuments } },
  );
};

const syncBuyDocsToSellLetters = async ({ regRegex, buyDocuments }) => {
  if (!regRegex || !buyDocuments) return;

  const rcData = buyDocuments.vehicleRC;
  if (!rcData || (!rcData.front && !rcData.back)) return;

  const updateFields = {
    "documents.vehicleRC": rcData,
    "documents.vehicleRCUploadMode":
      buyDocuments.vehicleRCUploadMode || "separate",
  };

  try {
    await SellLetter.updateMany(
      { registrationNumber: regRegex },
      { $set: updateFields },
    );
  } catch (err) {
    console.error("Failed to sync RC from Buy to Sell Letters:", err);
  }
};

exports.createBuyLetter = [
  upload.fields([
    { name: "vehicleRCFront" },
    { name: "vehicleRCBack" },
    { name: "aadhaarFront" },
    { name: "aadhaarBack" },
    { name: "panPhoto" },
    { name: "deliveryPhoto" },
    { name: "signedDocBuy" },

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

      // Strip stray non-alphanumeric characters (backticks, spaces, etc.) from reg number
      if (buyLetterData.registrationNumber) {
        buyLetterData.registrationNumber = String(buyLetterData.registrationNumber)
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase();
      }

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
              sourceType: "buy-letter",
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
            body.pucIssueDate ||
            body.pucExpiryDate ||
            body.pucExpiry ||
            body.pucStatus;

          if (hasPUCFields) {
            const pucData = {
              personName: body.sellerName || body.buyerName || "Unknown",
              personPhone: body.selleraadharphone || body.buyerPhone || "",
              personEmail: "",
              sourceType: "buy-letter",
              vehicleModel: body.vehicleModel || "",
              brand: body.vehicleName || "",
              year: "",
              regNo: regNo,
              vehicleRegNo: regNo,
              pucIssueDate: body.pucIssueDate
                ? new Date(body.pucIssueDate)
                : undefined,
              pucExpiryDate:
                body.pucExpiryDate || body.pucExpiry
                  ? new Date(body.pucExpiryDate || body.pucExpiry)
                  : undefined,
              pucExpiry:
                body.pucExpiryDate || body.pucExpiry
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

      const files = req.files || {};
      const uploadedUrls = {
        vehicleRC: { front: null, back: null },
        aadhaar: { front: null, back: null },
        pan: null,
        deliveryPhoto: null,
        signedDocBuy: null,

        insuranceCertificate: { pages: [] },
        vehicleNOC: { pages: [] },
        vehicleBuyReceipt: { pages: [] },
        vehiclePhotos: [],
      };

      let preservedDocs = {};

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

      let removedDocumentsSet = new Set();
      if (body.removedDocuments) {
        try {
          const parsed =
            typeof body.removedDocuments === "string"
              ? JSON.parse(body.removedDocuments)
              : body.removedDocuments;
          if (Array.isArray(parsed)) {
            removedDocumentsSet = new Set(parsed);
          }
        } catch (e) {
          console.error("Failed to parse removedDocuments:", e);
        }
      }

      if (existingDocuments && Object.keys(preservedDocs).length === 0) {
        const ed = existingDocuments;
        const notRemoved = (key) => !removedDocumentsSet.has(key);

        if (ed.vehicleRC?.front && notRemoved("vehicleRCFront"))
          preservedDocs.vehicleRCFront = ed.vehicleRC.front;
        if (ed.vehicleRC?.back && notRemoved("vehicleRCBack"))
          preservedDocs.vehicleRCBack = ed.vehicleRC.back;
        if (ed.aadhaar?.front && notRemoved("aadhaarFront"))
          preservedDocs.aadhaarFront = ed.aadhaar.front;
        if (ed.aadhaar?.back && notRemoved("aadhaarBack"))
          preservedDocs.aadhaarBack = ed.aadhaar.back;
        if (ed.pan && notRemoved("panPhoto")) preservedDocs.panPhoto = ed.pan;
        if (ed.deliveryPhoto && notRemoved("deliveryPhoto"))
          preservedDocs.deliveryPhoto = ed.deliveryPhoto;
        if (ed.signedDocBuy && notRemoved("signedDocBuy"))
          preservedDocs.signedDocBuy = ed.signedDocBuy;
        if (ed.vehiclePhotos?.length && notRemoved("vehiclePhotos"))
          preservedDocs.vehiclePhotos = ed.vehiclePhotos;
        if (
          ed.insuranceCertificate?.pages?.length &&
          notRemoved("insuranceCertificate")
        )
          preservedDocs.insuranceCertificate = ed.insuranceCertificate.pages;
        if (ed.vehicleNOC?.pages?.length && notRemoved("vehicleNOC"))
          preservedDocs.vehicleNOC = ed.vehicleNOC.pages;
        if (
          ed.vehicleBuyReceipt?.pages?.length &&
          notRemoved("vehicleBuyReceipt")
        )
          preservedDocs.vehicleBuyReceipt = ed.vehicleBuyReceipt.pages;
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

        return await processImageFile(file, nameHint);
      };

      const processPdfFileToPages = async (file, nameHint) => {
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
            return uploadBufferToImageKit(
              buf,
              filename,
              "application/pdf",
            ).then((u) => u.url);
          }),
        );
        return pageUrls;
      };

      try {
        const processMultiFileGroup = async (
          fileList,
          namePrefix,
          limit = 200,
        ) => {
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

          return results.flat();
        };

        const [
          rcFront,
          rcBack,
          aadhaarFront,
          aadhaarBack,
          pan,
          delivery,
          signedDocBuy,
        ] = await Promise.all([
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
          files.signedDocBuy?.[0]
            ? processFile(files.signedDocBuy[0], "signed-doc-buy")
            : Promise.resolve(preservedDocs.signedDocBuy || null),
        ]);

        uploadedUrls.vehicleRC.front = rcFront;
        uploadedUrls.vehicleRC.back = rcBack;
        uploadedUrls.aadhaar.front = aadhaarFront;
        uploadedUrls.aadhaar.back = aadhaarBack;
        uploadedUrls.pan = pan;
        uploadedUrls.deliveryPhoto = delivery;
        uploadedUrls.signedDocBuy = signedDocBuy;

        const [vehiclePhotos, insuranceCertPages, nocPages, buyReceiptPages] =
          await Promise.all([
            files.vehiclePhotos?.length
              ? Promise.all(
                  files.vehiclePhotos
                    .slice(0, 10)
                    .map((f, i) => processFile(f, `vehicle-photo-${i}`)),
                )
              : Promise.resolve(
                  preservedDocs.vehiclePhotos &&
                    Array.isArray(preservedDocs.vehiclePhotos)
                    ? preservedDocs.vehiclePhotos
                    : [],
                ),
            files.insuranceCertificate?.length
              ? processMultiFileGroup(
                  files.insuranceCertificate,
                  "insurance-certificate",
                  200,
                )
              : Promise.resolve(
                  preservedDocs.insuranceCertificate &&
                    Array.isArray(preservedDocs.insuranceCertificate)
                    ? preservedDocs.insuranceCertificate
                    : [],
                ),
            files.vehicleNOC?.length
              ? processMultiFileGroup(files.vehicleNOC, "vehicle-noc", 200)
              : Promise.resolve(
                  preservedDocs.vehicleNOC &&
                    Array.isArray(preservedDocs.vehicleNOC)
                    ? preservedDocs.vehicleNOC
                    : [],
                ),
            files.vehicleBuyReceipt?.length
              ? processMultiFileGroup(
                  files.vehicleBuyReceipt,
                  "vehicle-buy-receipt",
                  200,
                )
              : Promise.resolve(
                  preservedDocs.vehicleBuyReceipt &&
                    Array.isArray(preservedDocs.vehicleBuyReceipt)
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

      if (existingDocuments) {
        const ed = existingDocuments;
        const notRemoved = (key) => !removedDocumentsSet.has(key);

        if (
          !uploadedUrls.vehicleRC.front &&
          ed.vehicleRC?.front &&
          notRemoved("vehicleRCFront")
        )
          uploadedUrls.vehicleRC.front = ed.vehicleRC.front;
        if (
          !uploadedUrls.vehicleRC.back &&
          ed.vehicleRC?.back &&
          notRemoved("vehicleRCBack")
        )
          uploadedUrls.vehicleRC.back = ed.vehicleRC.back;
        if (
          !uploadedUrls.aadhaar.front &&
          ed.aadhaar?.front &&
          notRemoved("aadhaarFront")
        )
          uploadedUrls.aadhaar.front = ed.aadhaar.front;
        if (
          !uploadedUrls.aadhaar.back &&
          ed.aadhaar?.back &&
          notRemoved("aadhaarBack")
        )
          uploadedUrls.aadhaar.back = ed.aadhaar.back;
        if (!uploadedUrls.pan && ed.pan && notRemoved("panPhoto"))
          uploadedUrls.pan = ed.pan;
        if (
          !uploadedUrls.deliveryPhoto &&
          ed.deliveryPhoto &&
          notRemoved("deliveryPhoto")
        )
          uploadedUrls.deliveryPhoto = ed.deliveryPhoto;
        if (
          !uploadedUrls.signedDocBuy &&
          ed.signedDocBuy &&
          notRemoved("signedDocBuy")
        )
          uploadedUrls.signedDocBuy = ed.signedDocBuy;
        if (
          !uploadedUrls.vehiclePhotos?.length &&
          ed.vehiclePhotos?.length &&
          notRemoved("vehiclePhotos")
        )
          uploadedUrls.vehiclePhotos = ed.vehiclePhotos;
        if (
          !uploadedUrls.insuranceCertificate.pages?.length &&
          ed.insuranceCertificate?.pages?.length &&
          notRemoved("insuranceCertificate")
        )
          uploadedUrls.insuranceCertificate.pages =
            ed.insuranceCertificate.pages;
        if (
          !uploadedUrls.vehicleNOC.pages?.length &&
          ed.vehicleNOC?.pages?.length &&
          notRemoved("vehicleNOC")
        )
          uploadedUrls.vehicleNOC.pages = ed.vehicleNOC.pages;
        if (
          !uploadedUrls.vehicleBuyReceipt.pages?.length &&
          ed.vehicleBuyReceipt?.pages?.length &&
          notRemoved("vehicleBuyReceipt")
        )
          uploadedUrls.vehicleBuyReceipt.pages = ed.vehicleBuyReceipt.pages;
      }

      buyLetterData.documents = {
        vehicleRC: uploadedUrls.vehicleRC,
        vehicleRCUploadMode:
          body.vehicleRCUploadMode ||
          existingDocuments?.vehicleRCUploadMode ||
          "separate",
        aadhaar: uploadedUrls.aadhaar,
        aadhaarUploadMode:
          body.aadhaarUploadMode ||
          existingDocuments?.aadhaarUploadMode ||
          "separate",
        pan: uploadedUrls.pan,
        deliveryPhoto: uploadedUrls.deliveryPhoto,
        signedDocBuy: uploadedUrls.signedDocBuy,
        insuranceCertificate: uploadedUrls.insuranceCertificate,
        insuranceCertificateUploadMode:
          body.insuranceCertificateUploadMode ||
          existingDocuments?.insuranceCertificateUploadMode ||
          "separate",
        vehicleNOC: uploadedUrls.vehicleNOC,
        vehicleNOCUploadMode:
          body.vehicleNOCUploadMode ||
          existingDocuments?.vehicleNOCUploadMode ||
          "separate",
        vehicleBuyReceipt: uploadedUrls.vehicleBuyReceipt,
        vehicleBuyReceiptUploadMode:
          body.vehicleBuyReceiptUploadMode ||
          existingDocuments?.vehicleBuyReceiptUploadMode ||
          "separate",
        vehiclePhotos: uploadedUrls.vehiclePhotos,
        meta: { uploadedAt: new Date(), uploader: req.user.id },
      };

      if (regNo) {
        try {
          const sellLetterForDocs = await SellLetter.findOne({
            registrationNumber: new RegExp(`^${String(regNo).trim()}$`, "i"),
          })
            .sort({ createdAt: -1 })
            .select("documents")
            .lean();

          if (sellLetterForDocs?.documents) {
            buyLetterData.documents = mergeMissingBuyDocumentsFromSell(
              buyLetterData.documents,
              sellLetterForDocs.documents,
            );
          }
        } catch (docBackfillError) {
          console.error(
            "Failed to backfill buy docs from sell letter:",
            docBackfillError,
          );
        }
      }

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

        if (buyLetterData.previousVersionId) {
          query._id = { $ne: buyLetterData.previousVersionId };

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
          return res.status(409).json({
            message: "Buy letter with this registration number already exists",
            existing,
          });
        }
      }

      const buyLetter = new BuyLetter(buyLetterData);
      const savedBuyLetter = await buyLetter.save();

      if (regNo) {
        const regRegex = new RegExp(`^${String(regNo).trim()}$`, "i");
        await syncBuyDocsToSellLetters({
          regRegex,
          buyDocuments: savedBuyLetter.documents,
        });
      }

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
    const page = parseInt(req.query.page) || null;
    const limit = parseInt(req.query.limit) || 10;

    const conditions = {
      $or: [
        { user: req.user.id },
        { visibility: "staff" },
        ...(req.user.role === "staff" || req.user.role === "admin" ? [{}] : []),
      ],
    };

    let query = BuyLetter.find(conditions)
      .sort({ createdAt: -1 })
      .populate("user", "name role")
      .populate("vehicle")
      .populate(
        "pucId",
        "pucIssueDate pucExpiryDate pucExpiry pucStatus pucNumber vehicleRegNo regNo",
      )
      .populate(
        "insuranceId",
        "insuranceCompany insurancePolicyNumber insurancePolicyNo insuranceExpiryDate insuranceExpiry insuranceStatus vehicleRegNo regNo",
      )
      .populate(
        "previousVersionId",
        "sellerName sellerFatherName sellerCurrentAddress selleraadhar sellerpan selleraadharphone selleraadharphone2 vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition buyerName buyerFatherName buyerCurrentAddress buyernames buyerphone witnessname witnessphone dealername dealeraddress returnpersonname saleDate saleTime saleAmount paymentMethod todayDate todayTime note documents",
      )
      .lean();

    if (page) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const buyLetters = await query;

    const buyLettersWithPrevious = buyLetters.map((letter) => {
      const merged = { ...letter, previousVersion: letter.previousVersionId };
      if (letter.pucId && typeof letter.pucId === "object") {
        const p = letter.pucId;
        merged.pucIssueDate = p.pucIssueDate ?? merged.pucIssueDate;
        merged.pucExpiryDate =
          p.pucExpiryDate ?? p.pucExpiry ?? merged.pucExpiryDate;
        merged.pucStatus = p.pucStatus ?? merged.pucStatus;
      }
      if (letter.insuranceId && typeof letter.insuranceId === "object") {
        const i = letter.insuranceId;
        merged.insuranceCompany = i.insuranceCompany ?? merged.insuranceCompany;
        merged.insurancePolicyNumber =
          i.insurancePolicyNumber ??
          i.insurancePolicyNo ??
          merged.insurancePolicyNumber;
        merged.insuranceExpiryDate =
          i.insuranceExpiryDate ??
          i.insuranceExpiry ??
          merged.insuranceExpiryDate;
        merged.insuranceStatus = i.insuranceStatus ?? merged.insuranceStatus;
      }
      return merged;
    });

    const total = await BuyLetter.countDocuments(conditions);

    if (page) {
      res.json({
        buyLetters: buyLettersWithPrevious,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } else {
      res.json({
        buyLetters: buyLettersWithPrevious,
        total,
      });
    }
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
      .populate(
        "pucId",
        "pucIssueDate pucExpiryDate pucExpiry pucStatus pucNumber vehicleRegNo regNo",
      )
      .populate(
        "insuranceId",
        "insuranceCompany insurancePolicyNumber insurancePolicyNo insuranceExpiryDate insuranceExpiry insuranceStatus vehicleRegNo regNo",
      )
      .lean();

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

    const result = { ...buyLetter };
    if (buyLetter.pucId && typeof buyLetter.pucId === "object") {
      const p = buyLetter.pucId;
      result.pucIssueDate = p.pucIssueDate ?? result.pucIssueDate;
      result.pucExpiryDate =
        p.pucExpiryDate ?? p.pucExpiry ?? result.pucExpiryDate;
      result.pucStatus = p.pucStatus ?? result.pucStatus;
    }
    if (buyLetter.insuranceId && typeof buyLetter.insuranceId === "object") {
      const i = buyLetter.insuranceId;
      result.insuranceCompany = i.insuranceCompany ?? result.insuranceCompany;
      result.insurancePolicyNumber =
        i.insurancePolicyNumber ??
        i.insurancePolicyNo ??
        result.insurancePolicyNumber;
      result.insuranceExpiryDate =
        i.insuranceExpiryDate ??
        i.insuranceExpiry ??
        result.insuranceExpiryDate;
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

    const updateData = { ...req.body };
    if (!Object.prototype.hasOwnProperty.call(req.body, "saleDate")) {
      delete updateData.saleDate;
    } else if (req.body.saleDate) {
      updateData.saleDate = new Date(req.body.saleDate);
    }

    // Strip stray non-alphanumeric characters (backticks, spaces, etc.) from reg number
    if (updateData.registrationNumber) {
      updateData.registrationNumber = String(updateData.registrationNumber)
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
    }

    const editedDate = new Date();
    updateData.editedAt = editedDate;
    updateData.editedBy = req.user.id;

    const hours = String(editedDate.getHours()).padStart(2, "0");
    const minutes = String(editedDate.getMinutes()).padStart(2, "0");
    updateData.editedTime = `${hours}:${minutes}`;

    try {
      const regNo =
        updateData.registrationNumber || buyLetter.registrationNumber;
      if (regNo) {
        const regRegex = new RegExp(`^${String(regNo).trim()}$`, "i");

        const normDate = (d) =>
          d ? new Date(d).toISOString().split("T")[0] : "";

        const hasInsuranceFields =
          updateData.insuranceCompany ||
          updateData.insurancePolicyNumber ||
          updateData.insuranceExpiryDate ||
          updateData.insuranceStatus;
        if (hasInsuranceFields) {
          const existingIns = await Insurance.findOne({
            vehicleRegNo: regRegex,
          }).lean();
          const insuranceChanged =
            !existingIns ||
            String(updateData.insuranceCompany || "") !==
              String(existingIns.insuranceCompany || "") ||
            String(updateData.insurancePolicyNumber || "") !==
              String(existingIns.insurancePolicyNumber || "") ||
            normDate(updateData.insuranceExpiryDate) !==
              normDate(existingIns.insuranceExpiryDate) ||
            String(updateData.insuranceStatus || "") !==
              String(existingIns.insuranceStatus || "");

          if (insuranceChanged) {
            const insuranceData = {
              personName:
                updateData.sellerName || buyLetter.sellerName || "Unknown",
              personPhone:
                updateData.selleraadharphone ||
                buyLetter.selleraadharphone ||
                "",
              personEmail: "",
              sourceType: "buy-letter",
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
          } else if (existingIns) {
            updateData.insuranceId = existingIns._id;
          }
        }

        const hasPUCFields =
          updateData.pucIssueDate ||
          updateData.pucExpiryDate ||
          updateData.pucExpiry ||
          updateData.pucStatus;
        if (hasPUCFields) {
          const existingPUC = await PUC.findOne({
            $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }],
          }).lean();
          const pucChanged =
            !existingPUC ||
            normDate(updateData.pucIssueDate) !==
              normDate(existingPUC.pucIssueDate) ||
            normDate(updateData.pucExpiryDate || updateData.pucExpiry) !==
              normDate(existingPUC.pucExpiryDate || existingPUC.pucExpiry) ||
            String(updateData.pucStatus || "") !==
              String(existingPUC.pucStatus || "");

          if (pucChanged) {
            const pucData = {
              personName:
                updateData.sellerName || buyLetter.sellerName || "Unknown",
              personPhone:
                updateData.selleraadharphone ||
                buyLetter.selleraadharphone ||
                "",
              personEmail: "",
              sourceType: "buy-letter",
              vehicleModel:
                updateData.vehicleModel || buyLetter.vehicleModel || "",
              brand: updateData.vehicleName || buyLetter.vehicleName || "",
              year: "",
              regNo: regNo,
              vehicleRegNo: regNo,
              pucIssueDate: updateData.pucIssueDate
                ? new Date(updateData.pucIssueDate)
                : undefined,
              pucExpiryDate:
                updateData.pucExpiryDate || updateData.pucExpiry
                  ? new Date(updateData.pucExpiryDate || updateData.pucExpiry)
                  : undefined,
              pucExpiry:
                updateData.pucExpiryDate || updateData.pucExpiry
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
          } else if (existingPUC) {
            updateData.pucId = existingPUC._id;
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

    const regNo = updateData.registrationNumber || buyLetter.registrationNumber;
    if (regNo && buyLetter.documents) {
      const regRegex = new RegExp(`^${String(regNo).trim()}$`, "i");
      await syncBuyDocsToSellLetters({
        regRegex,
        buyDocuments: buyLetter.documents,
      });
    }

    res.json(buyLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteBuyLetter = async (req, res) => {
  try {
    const buyLetter = await BuyLetter.findById(req.params.id);

    if (!buyLetter) {
      return res.status(404).json({ message: "Buy letter not found" });
    }

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
