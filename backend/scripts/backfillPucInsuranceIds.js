/**
 * One-time migration script: Backfill pucId and insuranceId references
 * on existing SellLetter and BuyLetter documents.
 *
 * Also ensures the inline PUC/Insurance fields on each letter match
 * the current master record values (single source of truth sync).
 *
 * Run: node backend/scripts/backfillPucInsuranceIds.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const PUC = require("../models/PUC");
const Insurance = require("../models/Insurance");
const SellLetter = require("../models/SellLetter");
const BuyLetter = require("../models/BuyLetter");

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/okmotor";

async function backfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  // Build lookup maps for PUC and Insurance by registration number
  const allPUC = await PUC.find().lean();
  const pucMap = {};
  for (const p of allPUC) {
    const keys = [p.vehicleRegNo, p.regNo].filter(Boolean);
    for (const k of keys) {
      pucMap[k.trim().toLowerCase()] = p;
    }
  }

  const allInsurance = await Insurance.find().lean();
  const insMap = {};
  for (const i of allInsurance) {
    const keys = [i.vehicleRegNo, i.regNo].filter(Boolean);
    for (const k of keys) {
      insMap[k.trim().toLowerCase()] = i;
    }
  }

  console.log(`Loaded ${allPUC.length} PUC records, ${allInsurance.length} Insurance records.`);

  let sellUpdated = 0;
  let buyUpdated = 0;

  // ── Backfill SellLetters ──
  const sellLetters = await SellLetter.find().lean();
  for (const letter of sellLetters) {
    const regKey = (letter.registrationNumber || "").trim().toLowerCase();
    if (!regKey) continue;

    const pucDoc = pucMap[regKey];
    const insDoc = insMap[regKey];

    const update = {};

    if (pucDoc) {
      // Only link if not already linked OR link is stale
      if (String(letter.pucId) !== String(pucDoc._id)) {
        update.pucId = pucDoc._id;
      }
      // Always sync inline fields to master values
      update.pucIssueDate = pucDoc.pucIssueDate;
      update.pucExpiryDate = pucDoc.pucExpiryDate || pucDoc.pucExpiry;
      update.pucStatus = pucDoc.pucStatus;
    }

    if (insDoc) {
      if (String(letter.insuranceId) !== String(insDoc._id)) {
        update.insuranceId = insDoc._id;
      }
      update.insuranceCompany = insDoc.insuranceCompany;
      update.insurancePolicyNumber = insDoc.insurancePolicyNumber || insDoc.insurancePolicyNo;
      update.insuranceExpiryDate = insDoc.insuranceExpiryDate || insDoc.insuranceExpiry;
      update.insuranceStatus = insDoc.insuranceStatus;
    }

    if (Object.keys(update).length > 0) {
      await SellLetter.updateOne({ _id: letter._id }, { $set: update });
      sellUpdated++;
    }
  }

  // ── Backfill BuyLetters ──
  const buyLetters = await BuyLetter.find().lean();
  for (const letter of buyLetters) {
    const regKey = (letter.registrationNumber || "").trim().toLowerCase();
    if (!regKey) continue;

    const pucDoc = pucMap[regKey];
    const insDoc = insMap[regKey];

    const update = {};

    if (pucDoc) {
      if (String(letter.pucId) !== String(pucDoc._id)) {
        update.pucId = pucDoc._id;
      }
      update.pucIssueDate = pucDoc.pucIssueDate;
      update.pucExpiryDate = pucDoc.pucExpiryDate || pucDoc.pucExpiry;
      update.pucStatus = pucDoc.pucStatus;
    }

    if (insDoc) {
      if (String(letter.insuranceId) !== String(insDoc._id)) {
        update.insuranceId = insDoc._id;
      }
      update.insuranceCompany = insDoc.insuranceCompany;
      update.insurancePolicyNumber = insDoc.insurancePolicyNumber || insDoc.insurancePolicyNo;
      update.insuranceExpiryDate = insDoc.insuranceExpiryDate || insDoc.insuranceExpiry;
      update.insuranceStatus = insDoc.insuranceStatus;
    }

    if (Object.keys(update).length > 0) {
      await BuyLetter.updateOne({ _id: letter._id }, { $set: update });
      buyUpdated++;
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`  SellLetters updated: ${sellUpdated} / ${sellLetters.length}`);
  console.log(`  BuyLetters updated:  ${buyUpdated} / ${buyLetters.length}`);

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
}

backfill().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
