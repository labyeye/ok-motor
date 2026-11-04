const mongoose = require("mongoose");

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (s) =>
  String(s || "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

// Case-insensitive exact match for a registration number (special chars escaped).
const regRegex = (reg) => new RegExp(`^${esc(String(reg).trim())}$`, "i");

// A duplicate means a FRESH letter for a registration number that already has one.
// An edit (previousVersionId present, same vehicle) is a new version, never a duplicate.
const findFreshDuplicate = async (Model, data) => {
  const reg = data.registrationNumber && String(data.registrationNumber).trim();
  if (!reg) return null;

  const prevId = data.previousVersionId;
  if (prevId) {
    const prev = mongoose.isValidObjectId(prevId)
      ? await Model.findById(prevId).select("registrationNumber").lean()
      : null;
    if (!prev || norm(prev.registrationNumber) === norm(reg)) return null;
  }

  return Model.findOne({ registrationNumber: regRegex(reg) })
    .select("_id registrationNumber")
    .lean();
};

module.exports = { regRegex, findFreshDuplicate };
