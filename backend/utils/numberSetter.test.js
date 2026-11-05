// node utils/numberSetter.test.js
require("../config/db");
const assert = require("assert");
const mongoose = require("mongoose");
const M = mongoose.model("T", new mongoose.Schema({ saleAmount: { type: Number, required: true }, n: Number }));
const ok = (v) => new M({ saleAmount: v }).validateSync();
assert(!ok("19,000") && new M({ saleAmount: "19,000" }).saleAmount === 19000);
assert(new M({ saleAmount: "₹ 1,25,000.50" }).saleAmount === 125000.5);
assert(new M({ saleAmount: 500 }).saleAmount === 500);
assert(ok("abc"), "garbage must still fail");
const q = M.find({}).cast(M, { saleAmount: "19,000" });
assert(q.saleAmount === 19000, "query/update casting too");
const u = M.findOneAndUpdate({}, { $set: { saleAmount: "7,500" } });
assert(u._castUpdate(u._update).$set.saleAmount === 7500, "update casting");
console.log("number setter ok");
process.exit(0);
