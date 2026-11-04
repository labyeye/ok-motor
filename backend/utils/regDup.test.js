// node utils/regDup.test.js
const assert = require("assert");
const { findFreshDuplicate } = require("./regDup");
const A = "64b000000000000000000001";
const docs = [{ _id: A, registrationNumber: "BR01AB1234" }];
const Model = {
  findById: (id) => ({ select: () => ({ lean: async () => docs.find((d) => d._id === id) || null }) }),
  findOne: (q) => ({ select: () => ({ lean: async () => docs.find((d) => q.registrationNumber.test(d.registrationNumber)) || null }) }),
};
(async () => {
  assert(await findFreshDuplicate(Model, { registrationNumber: "br01ab1234" }), "fresh on existing reg must be duplicate");
  assert(!(await findFreshDuplicate(Model, { registrationNumber: "BR01AB1234", previousVersionId: A })), "edit must not be duplicate");
  assert(!(await findFreshDuplicate(Model, { registrationNumber: "BR01 AB 1234", previousVersionId: A })), "edit with reformatted reg must not be duplicate");
  assert(!(await findFreshDuplicate(Model, { registrationNumber: "BR09ZZ9999" })), "brand new reg is fine");
  docs.push({ _id: "64b000000000000000000002", registrationNumber: "BR02CD5678" });
  assert(await findFreshDuplicate(Model, { registrationNumber: "BR02CD5678", previousVersionId: A }), "edit that moves onto another existing reg is a duplicate");
  console.log("regDup ok");
})();
