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

const stripBuyOnlyDocuments = (docs) => {
  if (!docs) return docs;
  return {
    vehicleRC: docs.vehicleRC || undefined,
    vehicleRCUploadMode: docs.vehicleRCUploadMode || undefined,
  };
};

const syncMasterIdentityFromSellLetter = async ({
  regRegex,
  buyerName,
  buyerPhone,
  buyerEmail,
}) => {
  const identityFields = {
    personName: buyerName || "Unknown",
    personPhone: buyerPhone || "",
    personEmail: buyerEmail || "",
    sourceType: "sell-letter",
  };

  await Promise.all([
    Insurance.updateMany(
      { $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }] },
      { $set: identityFields },
    ),
    PUC.updateMany(
      { $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }] },
      { $set: identityFields },
    ),
  ]);
};

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const hasArray = (value) => Array.isArray(value) && value.length > 0;

const mergeMissingSellDocumentsIntoBuy = (target, source) => {
  if (!target || !source) return target;

  const merged = {
    ...target,
    vehicleRC: { ...(target.vehicleRC || {}) },
    insuranceCertificate: {
      ...(target.insuranceCertificate || {}),
      pages: Array.isArray(target.insuranceCertificate?.pages)
        ? [...target.insuranceCertificate.pages]
        : [],
    },
    vehicleNOC: {
      ...(target.vehicleNOC || {}),
      pages: Array.isArray(target.vehicleNOC?.pages)
        ? [...target.vehicleNOC.pages]
        : [],
    },
    transferReceipt: {
      ...(target.transferReceipt || {}),
      pages: Array.isArray(target.transferReceipt?.pages)
        ? [...target.transferReceipt.pages]
        : [],
    },
  };

  if (!hasText(merged.vehicleRC.front) && hasText(source.vehicleRC?.front)) {
    merged.vehicleRC.front = source.vehicleRC.front;
  }
  if (!hasText(merged.vehicleRC.back) && hasText(source.vehicleRC?.back)) {
    merged.vehicleRC.back = source.vehicleRC.back;
  }

  const sourceInsurancePages = Array.isArray(source.insuranceCertificate?.pages)
    ? source.insuranceCertificate.pages
    : Array.isArray(source.insuranceCertificate)
      ? source.insuranceCertificate
      : [];
  if (
    !hasArray(merged.insuranceCertificate.pages) &&
    hasArray(sourceInsurancePages)
  ) {
    merged.insuranceCertificate.pages = [...sourceInsurancePages];
  }

  const sourceNocPages = Array.isArray(source.vehicleNOC?.pages)
    ? source.vehicleNOC.pages
    : Array.isArray(source.vehicleNOC)
      ? source.vehicleNOC
      : [];
  if (!hasArray(merged.vehicleNOC.pages) && hasArray(sourceNocPages)) {
    merged.vehicleNOC.pages = [...sourceNocPages];
  }

  const sourceTransferPages = Array.isArray(source.transferReceipt?.pages)
    ? source.transferReceipt.pages
    : Array.isArray(source.transferReceipt)
      ? source.transferReceipt
      : [];
  if (
    !hasArray(merged.transferReceipt.pages) &&
    hasArray(sourceTransferPages)
  ) {
    merged.transferReceipt.pages = [...sourceTransferPages];
  }

  return merged;
};

const syncMissingBuyDocsFromSell = async ({ regRegex, sellDocuments }) => {
  if (!regRegex || !sellDocuments) return;

  const buyLetter = await BuyLetter.findOne({
    registrationNumber: regRegex,
  })
    .sort({ createdAt: -1 })
    .select("documents")
    .lean();

  if (!buyLetter?.documents) return;

  const mergedDocuments = mergeMissingSellDocumentsIntoBuy(
    buyLetter.documents,
    sellDocuments,
  );

  await BuyLetter.updateOne(
    { registrationNumber: regRegex },
    { $set: { documents: mergedDocuments } },
  );
};

exports.createSellLetter = [
  upload.fields([
    { name: "vehicleRCFront" },
    { name: "vehicleRCBack" },
    { name: "aadhaarFront" },
    { name: "aadhaarBack" },
    { name: "panPhoto" },
    { name: "deliveryPhoto" },
    { name: "signedDocSell" },
    { name: "vehiclePhotos" },

    { name: "insuranceCertificate", maxCount: 50 },
    { name: "vehicleNOC", maxCount: 50 },
    { name: "transferReceipt", maxCount: 50 },
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

      const regNo = sellLetterData.registrationNumber;
      if (regNo) {
        try {
          const hasInsuranceFields =
            bodyData.insuranceCompany ||
            bodyData.insurancePolicyNumber ||
            bodyData.insuranceExpiryDate ||
            bodyData.insuranceStatus;

          if (hasInsuranceFields) {
            const insuranceData = {
              personName: bodyData.buyerName || "Unknown",
              personPhone: bodyData.buyerPhone || "",
              personEmail: bodyData.buyerEmail || "",
              sourceType: "sell-letter",
              vehicleModel: bodyData.vehicleModel || "",
              brand: bodyData.vehicleName || "",
              year: "",
              regNo: regNo,
              vehicleRegNo: regNo,
              insuranceCompany: bodyData.insuranceCompany,
              insurancePolicyNumber: bodyData.insurancePolicyNumber,
              insuranceExpiryDate: bodyData.insuranceExpiryDate
                ? new Date(bodyData.insuranceExpiryDate)
                : undefined,
              insuranceStatus: bodyData.insuranceStatus,
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
              sellLetterData.insuranceId = insuranceDoc._id;
              sellLetterData.insuranceCompany = insuranceDoc.insuranceCompany;
              sellLetterData.insurancePolicyNumber =
                insuranceDoc.insurancePolicyNumber;
              sellLetterData.insuranceExpiryDate =
                insuranceDoc.insuranceExpiryDate;
              sellLetterData.insuranceStatus = insuranceDoc.insuranceStatus;
            }
          } else {
            const existingInsurance = await Insurance.findOne({
              vehicleRegNo: new RegExp(`^${regNo}$`, "i"),
            });
            if (existingInsurance) {
              sellLetterData.insuranceId = existingInsurance._id;
              sellLetterData.insuranceCompany =
                existingInsurance.insuranceCompany;
              sellLetterData.insurancePolicyNumber =
                existingInsurance.insurancePolicyNumber;
              sellLetterData.insuranceExpiryDate =
                existingInsurance.insuranceExpiryDate;
              sellLetterData.insuranceStatus =
                existingInsurance.insuranceStatus;
            }
          }
        } catch (e) {
          console.error("Insurance upsert/fetch failed:", e);
        }

        try {
          const hasPUCFields =
            bodyData.pucIssueDate ||
            bodyData.pucExpiryDate ||
            bodyData.pucExpiry ||
            bodyData.pucStatus;

          if (hasPUCFields) {
            const pucData = {
              personName: bodyData.buyerName || "Unknown",
              personPhone: bodyData.buyerPhone || "",
              personEmail: bodyData.buyerEmail || "",
              sourceType: "sell-letter",
              vehicleModel: bodyData.vehicleModel || "",
              brand: bodyData.vehicleName || "",
              year: "",
              regNo: regNo,
              vehicleRegNo: regNo,
              pucIssueDate: bodyData.pucIssueDate
                ? new Date(bodyData.pucIssueDate)
                : undefined,
              pucExpiryDate:
                bodyData.pucExpiryDate || bodyData.pucExpiry
                  ? new Date(bodyData.pucExpiryDate || bodyData.pucExpiry)
                  : undefined,
              pucExpiry:
                bodyData.pucExpiryDate || bodyData.pucExpiry
                  ? new Date(bodyData.pucExpiryDate || bodyData.pucExpiry)
                  : undefined,
              pucStatus: bodyData.pucStatus,
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
              sellLetterData.pucId = pucDoc._id;
              sellLetterData.pucIssueDate = pucDoc.pucIssueDate;
              sellLetterData.pucExpiryDate =
                pucDoc.pucExpiryDate || pucDoc.pucExpiry;
              sellLetterData.pucStatus = pucDoc.pucStatus;
            }
          } else {
            const existingPUC = await PUC.findOne({
              $or: [
                { vehicleRegNo: new RegExp(`^${regNo}$`, "i") },
                { regNo: new RegExp(`^${regNo}$`, "i") },
              ],
            });
            if (existingPUC) {
              sellLetterData.pucId = existingPUC._id;
              sellLetterData.pucIssueDate = existingPUC.pucIssueDate;
              sellLetterData.pucExpiryDate =
                existingPUC.pucExpiryDate || existingPUC.pucExpiry;
              sellLetterData.pucStatus = existingPUC.pucStatus;
            }
          }
        } catch (e) {
          console.error("PUC upsert/fetch failed:", e);
        }

        try {
          await syncMasterIdentityFromSellLetter({
            regRegex,
            buyerName: bodyData.buyerName,
            buyerPhone: bodyData.buyerPhone,
            buyerEmail: bodyData.buyerEmail,
          });
        } catch (e) {
          console.error("Sell identity sync failed:", e);
        }
      }

      const files = req.files || {};
      const uploadedUrls = {
        vehicleRC: { front: null, back: null },
        aadhaar: { front: null, back: null },
        pan: null,
        deliveryPhoto: null,
        signedDocSell: null,
        vehiclePhotos: [],
        insuranceCertificate: { pages: [] },
        vehicleNOC: { pages: [] },
        transferReceipt: { pages: [] },
      };

      let existingDocuments = null;
      if (req.body.existingDocuments) {
        try {
          existingDocuments =
            typeof req.body.existingDocuments === "string"
              ? JSON.parse(req.body.existingDocuments)
              : req.body.existingDocuments;
        } catch (e) {
          console.error("Error parsing existingDocuments:", e);
        }
      }

      try {
        if (req.body.preservedDocuments) {
          const p = JSON.parse(req.body.preservedDocuments);
          if (p.vehicleRCFront) uploadedUrls.vehicleRC.front = p.vehicleRCFront;
          if (p.vehicleRCBack) uploadedUrls.vehicleRC.back = p.vehicleRCBack;
          if (p.aadhaarFront) uploadedUrls.aadhaar.front = p.aadhaarFront;
          if (p.aadhaarBack) uploadedUrls.aadhaar.back = p.aadhaarBack;
          if (p.panPhoto) uploadedUrls.pan = p.panPhoto;
          if (p.deliveryPhoto) uploadedUrls.deliveryPhoto = p.deliveryPhoto;
          if (p.signedDocSell) uploadedUrls.signedDocSell = p.signedDocSell;

          if (p.vehiclePhotos && Array.isArray(p.vehiclePhotos)) {
            uploadedUrls.vehiclePhotos = [...p.vehiclePhotos];
          }
          if (p.insuranceCertificate && Array.isArray(p.insuranceCertificate)) {
            uploadedUrls.insuranceCertificate.pages = [
              ...p.insuranceCertificate,
            ];
          }
          if (p.vehicleNOC && Array.isArray(p.vehicleNOC)) {
            uploadedUrls.vehicleNOC.pages = [...p.vehicleNOC];
          }
          if (p.transferReceipt && Array.isArray(p.transferReceipt)) {
            uploadedUrls.transferReceipt.pages = [...p.transferReceipt];
          }
          if (p.transferReceiptAgent) {
            uploadedUrls.transferReceipt.agentName = p.transferReceiptAgent;
          }
          if (p.transferReceipt && Array.isArray(p.transferReceipt)) {
            uploadedUrls.transferReceipt.pages = [...p.transferReceipt];
          }
        } else if (existingDocuments && !req.body.existingDocuments) {
        } else if (
          existingDocuments &&
          req.body.existingDocuments &&
          !req.body.preservedDocuments
        ) {
          const ed = existingDocuments;
          if (ed.vehicleRC?.front)
            uploadedUrls.vehicleRC.front = ed.vehicleRC.front;
          if (ed.vehicleRC?.back)
            uploadedUrls.vehicleRC.back = ed.vehicleRC.back;
          if (ed.aadhaar?.front) uploadedUrls.aadhaar.front = ed.aadhaar.front;
          if (ed.aadhaar?.back) uploadedUrls.aadhaar.back = ed.aadhaar.back;
          if (ed.pan) uploadedUrls.pan = ed.pan;
          if (ed.deliveryPhoto) uploadedUrls.deliveryPhoto = ed.deliveryPhoto;
          if (ed.signedDocSell) uploadedUrls.signedDocSell = ed.signedDocSell;
          if (ed.vehiclePhotos?.length)
            uploadedUrls.vehiclePhotos = [...ed.vehiclePhotos];
          if (ed.insuranceCertificate?.pages?.length)
            uploadedUrls.insuranceCertificate.pages = [
              ...ed.insuranceCertificate.pages,
            ];
          if (ed.vehicleNOC?.pages?.length)
            uploadedUrls.vehicleNOC.pages = [...ed.vehicleNOC.pages];
          if (ed.transferReceipt?.pages?.length)
            uploadedUrls.transferReceipt.pages = [...ed.transferReceipt.pages];
          if (ed.transferReceipt?.agentName)
            uploadedUrls.transferReceipt.agentName =
              ed.transferReceipt.agentName;
          if (ed.transferReceipt?.pages?.length)
            uploadedUrls.transferReceipt.pages = [...ed.transferReceipt.pages];
        }
      } catch (e) {
        console.error("Error parsing preservedDocuments:", e);
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
          signedDocSell,
        ] = await Promise.all([
          files.vehicleRCFront?.[0]
            ? processFile(files.vehicleRCFront[0], "vehicle-rc-front")
            : Promise.resolve(null),
          files.vehicleRCBack?.[0]
            ? processFile(files.vehicleRCBack[0], "vehicle-rc-back")
            : Promise.resolve(null),
          files.aadhaarFront?.[0]
            ? processFile(files.aadhaarFront[0], "aadhaar-front")
            : Promise.resolve(null),
          files.aadhaarBack?.[0]
            ? processFile(files.aadhaarBack[0], "aadhaar-back")
            : Promise.resolve(null),
          files.panPhoto?.[0]
            ? processFile(files.panPhoto[0], "pan-photo")
            : Promise.resolve(null),
          files.deliveryPhoto?.[0]
            ? processFile(files.deliveryPhoto[0], "delivery-photo")
            : Promise.resolve(null),
          files.signedDocSell?.[0]
            ? processFile(files.signedDocSell[0], "signed-doc-sell")
            : Promise.resolve(null),
        ]);

        if (rcFront !== null) uploadedUrls.vehicleRC.front = rcFront;
        if (rcBack !== null) uploadedUrls.vehicleRC.back = rcBack;
        if (aadhaarFront !== null) uploadedUrls.aadhaar.front = aadhaarFront;
        if (aadhaarBack !== null) uploadedUrls.aadhaar.back = aadhaarBack;
        if (pan !== null) uploadedUrls.pan = pan;
        if (delivery !== null) uploadedUrls.deliveryPhoto = delivery;
        if (signedDocSell !== null) uploadedUrls.signedDocSell = signedDocSell;

        const [
          vehiclePhotos,
          insuranceCertPages,
          nocPages,
          transferReceiptPages,
        ] = await Promise.all([
          files.vehiclePhotos?.length
            ? Promise.all(
                files.vehiclePhotos
                  .slice(0, 10)
                  .map((f, i) => processFile(f, `vehicle-photo-${i}`)),
              )
            : Promise.resolve(null),
          files.insuranceCertificate?.length
            ? processMultiFileGroup(
                files.insuranceCertificate,
                "insurance-certificate",
                200,
              )
            : Promise.resolve(null),
          files.vehicleNOC?.length
            ? processMultiFileGroup(files.vehicleNOC, "vehicle-noc", 200)
            : Promise.resolve(null),
          files.transferReceipt?.length
            ? processMultiFileGroup(
                files.transferReceipt,
                "transfer-receipt",
                200,
              )
            : Promise.resolve(null),
        ]);

        if (vehiclePhotos !== null) uploadedUrls.vehiclePhotos = vehiclePhotos;
        if (insuranceCertPages !== null)
          uploadedUrls.insuranceCertificate.pages.push(...insuranceCertPages);
        if (nocPages !== null) uploadedUrls.vehicleNOC.pages.push(...nocPages);
        if (transferReceiptPages !== null)
          uploadedUrls.transferReceipt.pages.push(...transferReceiptPages);
      } catch (uploadErr) {
        console.error("Image upload failed, aborting create:", uploadErr);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }

      if (existingDocuments && !req.body.preservedDocuments) {
        const ed = existingDocuments;
        if (!uploadedUrls.vehicleRC.front && ed.vehicleRC?.front)
          uploadedUrls.vehicleRC.front = ed.vehicleRC.front;
        if (!uploadedUrls.vehicleRC.back && ed.vehicleRC?.back)
          uploadedUrls.vehicleRC.back = ed.vehicleRC.back;
        if (!uploadedUrls.aadhaar.front && ed.aadhaar?.front)
          uploadedUrls.aadhaar.front = ed.aadhaar.front;
        if (!uploadedUrls.aadhaar.back && ed.aadhaar?.back)
          uploadedUrls.aadhaar.back = ed.aadhaar.back;
        if (!uploadedUrls.pan && ed.pan) uploadedUrls.pan = ed.pan;
        if (!uploadedUrls.deliveryPhoto && ed.deliveryPhoto)
          uploadedUrls.deliveryPhoto = ed.deliveryPhoto;
        if (!uploadedUrls.signedDocSell && ed.signedDocSell)
          uploadedUrls.signedDocSell = ed.signedDocSell;
        if (!uploadedUrls.vehiclePhotos?.length && ed.vehiclePhotos?.length)
          uploadedUrls.vehiclePhotos = [...ed.vehiclePhotos];
        if (
          !uploadedUrls.insuranceCertificate.pages?.length &&
          ed.insuranceCertificate?.pages?.length
        )
          uploadedUrls.insuranceCertificate.pages = [
            ...ed.insuranceCertificate.pages,
          ];
        if (
          !uploadedUrls.vehicleNOC.pages?.length &&
          ed.vehicleNOC?.pages?.length
        )
          uploadedUrls.vehicleNOC.pages = [...ed.vehicleNOC.pages];
        if (
          !uploadedUrls.transferReceipt.pages?.length &&
          ed.transferReceipt?.pages?.length
        )
          uploadedUrls.transferReceipt.pages = [...ed.transferReceipt.pages];
        if (
          !uploadedUrls.transferReceipt.agentName &&
          ed.transferReceipt?.agentName
        )
          uploadedUrls.transferReceipt.agentName = ed.transferReceipt.agentName;
      }

      sellLetterData.documents = {
        vehicleRC: uploadedUrls.vehicleRC,
        vehicleRCUploadMode:
          bodyData.vehicleRCUploadMode ||
          existingDocuments?.vehicleRCUploadMode ||
          "separate",
        aadhaar: uploadedUrls.aadhaar,
        aadhaarUploadMode:
          bodyData.aadhaarUploadMode ||
          existingDocuments?.aadhaarUploadMode ||
          "separate",
        pan: uploadedUrls.pan,
        deliveryPhoto: uploadedUrls.deliveryPhoto,
        signedDocSell: uploadedUrls.signedDocSell,
        vehiclePhotos: uploadedUrls.vehiclePhotos,
        insuranceCertificate: uploadedUrls.insuranceCertificate,
        insuranceCertificateUploadMode:
          bodyData.insuranceCertificateUploadMode ||
          existingDocuments?.insuranceCertificateUploadMode ||
          "separate",
        vehicleNOC: uploadedUrls.vehicleNOC,
        vehicleNOCUploadMode:
          bodyData.vehicleNOCUploadMode ||
          existingDocuments?.vehicleNOCUploadMode ||
          "separate",
        transferReceipt: uploadedUrls.transferReceipt,
        transferReceiptUploadMode:
          bodyData.transferReceiptUploadMode ||
          existingDocuments?.transferReceiptUploadMode ||
          "separate",
        meta: { uploadedAt: new Date(), uploader: req.user.id },
      };

      try {
        sellLetterData.documents.transferReceipt = sellLetterData.documents
          .transferReceipt || { pages: [] };
        sellLetterData.documents.transferReceipt.agentName =
          bodyData.transferReceiptAgent ||
          sellLetterData.documents.transferReceipt.agentName ||
          existingDocuments?.transferReceipt?.agentName ||
          null;
      } catch (e) {}

      const hasText = (v) => typeof v === "string" && v.trim().length > 0;
      const hasArray = (v) => Array.isArray(v) && v.length > 0;
      const hasDocumentContent = (docs) => {
        if (!docs) return false;
        return Boolean(
          hasText(docs.vehicleRC?.front) ||
          hasText(docs.vehicleRC?.back) ||
          hasText(docs.aadhaar?.front) ||
          hasText(docs.aadhaar?.back) ||
          hasText(docs.pan) ||
          hasText(docs.deliveryPhoto) ||
          hasText(docs.signedDocSell) ||
          hasArray(docs.vehiclePhotos) ||
          hasArray(docs.insuranceCertificate?.pages) ||
          hasArray(docs.vehicleNOC?.pages),
        );
      };

      const mergeMissingDocuments = (target, source) => {
        if (!target || !source) return target;

        const merged = {
          ...target,
          vehicleRC: { ...(target.vehicleRC || {}) },
          aadhaar: { ...(target.aadhaar || {}) },
          insuranceCertificate: {
            ...(target.insuranceCertificate || {}),
            pages: Array.isArray(target.insuranceCertificate?.pages)
              ? [...target.insuranceCertificate.pages]
              : [],
          },
          vehicleNOC: {
            ...(target.vehicleNOC || {}),
            pages: Array.isArray(target.vehicleNOC?.pages)
              ? [...target.vehicleNOC.pages]
              : [],
          },
        };

        if (
          !hasText(merged.vehicleRC.front) &&
          hasText(source.vehicleRC?.front)
        ) {
          merged.vehicleRC.front = source.vehicleRC.front;
        }
        if (
          !hasText(merged.vehicleRC.back) &&
          hasText(source.vehicleRC?.back)
        ) {
          merged.vehicleRC.back = source.vehicleRC.back;
        }

        if (!hasText(merged.aadhaar.front) && hasText(source.aadhaar?.front)) {
          merged.aadhaar.front = source.aadhaar.front;
        }
        if (!hasText(merged.aadhaar.back) && hasText(source.aadhaar?.back)) {
          merged.aadhaar.back = source.aadhaar.back;
        }

        if (!hasText(merged.pan) && hasText(source.pan)) {
          merged.pan = source.pan;
        }
        if (!hasText(merged.deliveryPhoto) && hasText(source.deliveryPhoto)) {
          merged.deliveryPhoto = source.deliveryPhoto;
        }
        if (!hasText(merged.signedDocSell) && hasText(source.signedDocSell)) {
          merged.signedDocSell = source.signedDocSell;
        }

        if (!hasArray(merged.vehiclePhotos) && hasArray(source.vehiclePhotos)) {
          merged.vehiclePhotos = [...source.vehiclePhotos];
        }

        const sourceInsurancePages = Array.isArray(
          source.insuranceCertificate?.pages,
        )
          ? source.insuranceCertificate.pages
          : Array.isArray(source.insuranceCertificate)
            ? source.insuranceCertificate
            : [];
        if (
          !hasArray(merged.insuranceCertificate.pages) &&
          hasArray(sourceInsurancePages)
        ) {
          merged.insuranceCertificate.pages = [...sourceInsurancePages];
        }

        const sourceNocPages = Array.isArray(source.vehicleNOC?.pages)
          ? source.vehicleNOC.pages
          : Array.isArray(source.vehicleNOC)
            ? source.vehicleNOC
            : [];
        if (!hasArray(merged.vehicleNOC.pages) && hasArray(sourceNocPages)) {
          merged.vehicleNOC.pages = [...sourceNocPages];
        }

        if (!merged.vehicleRCUploadMode && source.vehicleRCUploadMode) {
          merged.vehicleRCUploadMode = source.vehicleRCUploadMode;
        }
        if (!merged.aadhaarUploadMode && source.aadhaarUploadMode) {
          merged.aadhaarUploadMode = source.aadhaarUploadMode;
        }
        if (
          !merged.insuranceCertificateUploadMode &&
          source.insuranceCertificateUploadMode
        ) {
          merged.insuranceCertificateUploadMode =
            source.insuranceCertificateUploadMode;
        }
        if (!merged.vehicleNOCUploadMode && source.vehicleNOCUploadMode) {
          merged.vehicleNOCUploadMode = source.vehicleNOCUploadMode;
        }

        return merged;
      };

      try {
        const hasDocs = hasDocumentContent(sellLetterData.documents);

        const shouldMergePreviousDocs = !req.body.preservedDocuments;

        if (
          (!hasDocs || sellLetterData.previousVersionId || regNo) &&
          shouldMergePreviousDocs
        ) {
          if (sellLetterData.previousVersionId) {
            const previousSell = await SellLetter.findById(
              sellLetterData.previousVersionId,
            )
              .select("documents")
              .lean();
            if (previousSell?.documents) {
              sellLetterData.documents = mergeMissingDocuments(
                sellLetterData.documents,
                previousSell.documents,
              );
            }
          }

          if (regNo) {
            const buyLetterForDocs = await BuyLetter.findOne({
              registrationNumber: new RegExp(`^${String(regNo).trim()}$`, "i"),
            })
              .sort({ createdAt: -1 })
              .select("documents")
              .lean();
            if (buyLetterForDocs?.documents) {
              sellLetterData.documents = mergeMissingDocuments(
                sellLetterData.documents,
                stripBuyOnlyDocuments(buyLetterForDocs.documents),
              );
            }
          }
        }
      } catch (docMergeError) {
        console.error(
          "Failed to merge fallback documents for sell letter:",
          docMergeError,
        );
      }

      const sellLetter = new SellLetter(sellLetterData);
      const savedSellLetter = await sellLetter.save();

      if (regNo) {
        try {
          await syncMissingBuyDocsFromSell({
            regRegex: new RegExp(`^${String(regNo).trim()}$`, "i"),
            sellDocuments: savedSellLetter.documents,
          });
        } catch (docSyncError) {
          console.error(
            "Failed to sync buy docs from sell letter:",
            docSyncError,
          );
        }
      }

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

    vehicleDetails.brand =
      vehicleRecord.brand ||
      (vehicleRecord.vehicleName
        ? vehicleRecord.vehicleName.split(" ")[0]
        : undefined);

    vehicleDetails.year =
      vehicleRecord.manufacturingYear ||
      vehicleRecord.year ||
      vehicleRecord.year ||
      undefined;

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

    if (buyLetters[0] && buyLetters[0].documents) {
      vehicleDetails.buyLetterDocuments = stripBuyOnlyDocuments(
        buyLetters[0].documents,
      );
    }

    if (sellLetters[0] && sellLetters[0].documents) {
      vehicleDetails.documents = {
        vehicleRC: sellLetters[0].documents.vehicleRC,
        vehicleRCUploadMode: sellLetters[0].documents.vehicleRCUploadMode,
        vehicleNOC: sellLetters[0].documents.vehicleNOC,
        vehicleNOCUploadMode: sellLetters[0].documents.vehicleNOCUploadMode,
      };
    }

    try {
      const regRegex = new RegExp(
        `^${String(vehicleDetails.registrationNumber).trim()}$`,
        "i",
      );
      const [insuranceDoc, pucDoc] = await Promise.all([
        Insurance.findOne({
          $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }],
        }).lean(),
        PUC.findOne({
          $or: [{ vehicleRegNo: regRegex }, { regNo: regRegex }],
        }).lean(),
      ]);

      if (insuranceDoc) {
        vehicleDetails.insuranceCompany =
          insuranceDoc.insuranceCompany || vehicleDetails.insuranceCompany;
        vehicleDetails.insurancePolicyNumber =
          insuranceDoc.insurancePolicyNumber ||
          insuranceDoc.insurancePolicyNo ||
          vehicleDetails.insurancePolicyNumber;
        vehicleDetails.insuranceExpiryDate =
          insuranceDoc.insuranceExpiryDate ||
          insuranceDoc.insuranceExpiry ||
          vehicleDetails.insuranceExpiryDate;
        vehicleDetails.insuranceStatus =
          insuranceDoc.insuranceStatus || vehicleDetails.insuranceStatus;
        vehicleDetails.insuranceId = insuranceDoc._id;
      }

      if (pucDoc) {
        vehicleDetails.pucIssueDate =
          pucDoc.pucIssueDate || vehicleDetails.pucIssueDate;
        vehicleDetails.pucExpiryDate =
          pucDoc.pucExpiryDate ||
          pucDoc.pucExpiry ||
          vehicleDetails.pucExpiryDate;
        vehicleDetails.pucStatus = pucDoc.pucStatus || vehicleDetails.pucStatus;
        vehicleDetails.pucId = pucDoc._id;
      }
    } catch (e) {
      console.error("Failed to load master Insurance/PUC records:", e);
    }

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
        "pucId",
        "pucIssueDate pucExpiryDate pucExpiry pucStatus pucNumber vehicleRegNo regNo",
      )
      .populate(
        "insuranceId",
        "insuranceCompany insurancePolicyNumber insurancePolicyNo insuranceExpiryDate insuranceExpiry insuranceStatus vehicleRegNo regNo",
      )
      .populate(
        "previousVersionId",
        "vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition pucIssueDate pucExpiryDate pucStatus insuranceStatus insuranceExpiryDate insuranceCompany insurancePolicyNumber buyerName buyerFatherName buyerAddress buyerPhone buyerPhone2 buyerEmail buyerAadhar saleDate saleTime saleAmount paymentMethod todayDate todayTime previousDate previousTime witnessName witnessPhone note documents",
      )
      .lean();

    const sellLettersWithPrevious = sellLetters.map((letter) => {
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
        "pucId",
        "pucIssueDate pucExpiryDate pucExpiry pucStatus pucNumber vehicleRegNo regNo",
      )
      .populate(
        "insuranceId",
        "insuranceCompany insurancePolicyNumber insurancePolicyNo insuranceExpiryDate insuranceExpiry insuranceStatus vehicleRegNo regNo",
      )
      .populate(
        "previousVersionId",
        "vehicleName vehicleModel vehicleColor registrationNumber chassisNumber engineNumber vehiclekm vehicleCondition pucIssueDate pucExpiryDate pucStatus insuranceStatus insuranceExpiryDate insuranceCompany insurancePolicyNumber buyerName buyerFatherName buyerAddress buyerPhone buyerPhone2 buyerEmail buyerAadhar saleDate saleTime saleAmount paymentMethod todayDate todayTime previousDate previousTime witnessName witnessPhone note documents",
      )
      .lean();

    const sellLettersWithPrevious = sellLetters.map((letter) => {
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

    if (!sellLetter) {
      return res.status(404).json({ message: "Sell letter not found" });
    }

    const result = { ...sellLetter };
    if (sellLetter.pucId && typeof sellLetter.pucId === "object") {
      const p = sellLetter.pucId;
      result.pucIssueDate = p.pucIssueDate ?? result.pucIssueDate;
      result.pucExpiryDate =
        p.pucExpiryDate ?? p.pucExpiry ?? result.pucExpiryDate;
      result.pucStatus = p.pucStatus ?? result.pucStatus;
    }
    if (sellLetter.insuranceId && typeof sellLetter.insuranceId === "object") {
      const i = sellLetter.insuranceId;
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

exports.updateSellLetter = async (req, res) => {
  try {
    const sellLetter = await SellLetter.findById(req.params.id);

    if (!sellLetter) {
      return res.status(404).json({ message: "Sell letter not found" });
    }

    const updateData = { ...req.body };
    if (!Object.prototype.hasOwnProperty.call(req.body, "saleDate")) {
      delete updateData.saleDate;
    } else if (req.body.saleDate) {
      updateData.saleDate = new Date(req.body.saleDate);
    }

    const editedDate = new Date();
    updateData.editedAt = editedDate;
    updateData.editedBy = req.user && req.user.id ? req.user.id : undefined;

    const hours = String(editedDate.getHours()).padStart(2, "0");
    const minutes = String(editedDate.getMinutes()).padStart(2, "0");
    updateData.editedTime = `${hours}:${minutes}`;

    try {
      const regNo =
        updateData.registrationNumber || sellLetter.registrationNumber;
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
                updateData.buyerName || sellLetter.buyerName || "Unknown",
              personPhone:
                updateData.buyerPhone || sellLetter.buyerPhone || "",
              personEmail:
                updateData.buyerEmail || sellLetter.buyerEmail || "",
              sourceType: "sell-letter",
              vehicleModel:
                updateData.vehicleModel || sellLetter.vehicleModel || "",
              brand: updateData.vehicleName || sellLetter.vehicleName || "",
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
                updateData.buyerName || sellLetter.buyerName || "Unknown",
              personPhone:
                updateData.buyerPhone || sellLetter.buyerPhone || "",
              personEmail:
                updateData.buyerEmail || sellLetter.buyerEmail || "",
              sourceType: "sell-letter",
              vehicleModel:
                updateData.vehicleModel || sellLetter.vehicleModel || "",
              brand: updateData.vehicleName || sellLetter.vehicleName || "",
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

        try {
          await syncMasterIdentityFromSellLetter({
            regRegex,
            buyerName: updateData.buyerName || sellLetter.buyerName,
            buyerPhone: updateData.buyerPhone || sellLetter.buyerPhone,
            buyerEmail: updateData.buyerEmail || sellLetter.buyerEmail,
          });
        } catch (e) {
          console.error("Sell identity resync failed:", e);
        }
      }
    } catch (e) {
      console.error("Failed to sync Insurance/PUC on sell update:", e);
    }

    const updated = await SellLetter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (updated?.registrationNumber) {
      try {
        await syncMissingBuyDocsFromSell({
          regRegex: new RegExp(
            `^${String(updated.registrationNumber).trim()}$`,
            "i",
          ),
          sellDocuments: updated.documents,
        });
      } catch (docSyncError) {
        console.error(
          "Failed to sync buy docs from updated sell letter:",
          docSyncError,
        );
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteSellLetter = async (req, res) => {
  try {
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
