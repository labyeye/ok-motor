const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");
const Service = require("../models/ServiceBill");
const Advance = require("../models/AdvanceBill");
const PUC = require("../models/PUC");
const Insurance = require("../models/Insurance");
const mongoose = require("mongoose");

const getMonthlyData = async (model, matchCriteria = {}) => {
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

  let amountField;
  if (model.modelName === "BuyLetter" || model.modelName === "SellLetter") {
    amountField = "$saleAmount";
  } else if (model.modelName === "ServiceBill") {
    amountField = "$grandTotal";
  } else if (model.modelName === "AdvanceBill") {
    amountField = "$advancePaid";
  } else {
    amountField = "$amount";
  }

  const dateField =
    model.modelName === "ServiceBill" || model.modelName === "AdvanceBill"
      ? "$serviceDate"
      : "$saleDate";

  return model.aggregate([
    {
      $match: {
        ...matchCriteria,
        [dateField.replace("$", "")]: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: dateField },
          month: { $month: dateField },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: amountField },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
    {
      $project: {
        month: {
          $let: {
            vars: {
              monthsInString: [
                "",
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ],
            },
            in: {
              $arrayElemAt: ["$$monthsInString", "$_id.month"],
            },
          },
        },
        count: 1,
        totalAmount: 1,
      },
    },
  ]);
};
const getRecentTransactions = async (model, limit = 3, matchCriteria = {}) => {
  let selectFields = "customerName date amount";

  if (model.modelName === "BuyLetter") {
    return model
      .find(matchCriteria)
      .sort({ saleDate: -1, createdAt: -1 })
      .limit(limit)
      .select("sellerName saleDate saleAmount registrationNumber")
      .lean()
      .then((docs) =>
        docs.map((doc) => ({
          name: doc.sellerName,
          date: doc.saleDate,
          amount: doc.saleAmount,
          vehicle: doc.registrationNumber,
        })),
      );
  } else if (model.modelName === "SellLetter") {
    return model
      .find(matchCriteria)
      .sort({ saleDate: -1, createdAt: -1 })
      .limit(limit)
      .select("buyerName saleDate saleAmount registrationNumber")
      .lean()
      .then((docs) =>
        docs.map((doc) => ({
          name: doc.buyerName,
          date: doc.saleDate,
          amount: doc.saleAmount,
          vehicle: doc.registrationNumber,
        })),
      );
  } else if (model.modelName === "ServiceBill") {
    return model
      .find(matchCriteria)
      .sort({ serviceDate: -1, createdAt: -1 })
      .limit(limit)
      .select(
        "customerName serviceDate grandTotal registrationNumber serviceType",
      )
      .lean()
      .then((docs) =>
        docs.map((doc) => ({
          name: doc.customerName,
          date: doc.serviceDate,
          amount: doc.grandTotal,
          vehicle: doc.registrationNumber,
          serviceType: doc.serviceType,
        })),
      );
  } else if (model.modelName === "AdvanceBill") {
    return model
      .find(matchCriteria)
      .sort({ serviceDate: -1, createdAt: -1 })
      .limit(limit)
      .select("customerName serviceDate advancePaid registrationNumber")
      .lean()
      .then((docs) =>
        docs.map((doc) => ({
          name: doc.customerName,
          date: doc.serviceDate,
          amount: doc.advancePaid,
          vehicle: doc.registrationNumber,
        })),
      );
  }

  return model
    .find(matchCriteria)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .select(selectFields)
    .lean();
};

const getIncompleteLetterSummary = (letter, type) => {
  const missingFields = [];
  
  // Helper function to check if any part of a document exists (front, back, or combined)
  const hasDocumentPart = (docObj) => {
    if (!docObj) return false;
    return !!(docObj.front || docObj.back || docObj.combined);
  };

  const docPaths = {
    rc: letter.documents?.vehicleRC,
    aadhaar: letter.documents?.aadhaar,
    pan: letter.documents?.pan,
    signedDocBuy: letter.documents?.signedDocBuy,
    signedDocSell: letter.documents?.signedDocSell,
    vehicleBuyReceiptPages: letter.documents?.vehicleBuyReceipt?.pages,
    transferReceiptPages: letter.documents?.transferReceipt?.pages,
  };

  if (type === "buy") {
    // Check Vehicle RC - if either front, back, or combined exists, it's not missing
    if (!hasDocumentPart(docPaths.rc)) missingFields.push("Vehicle RC");
    
    // Check Aadhaar - if either front, back, or combined exists, it's not missing
    if (!hasDocumentPart(docPaths.aadhaar)) missingFields.push("Aadhar");
    
    if (!docPaths.signedDocBuy) missingFields.push("Signed Doc");
    if (!docPaths.pan) missingFields.push("PAN Card");
    if (!docPaths.vehicleBuyReceiptPages || docPaths.vehicleBuyReceiptPages.length === 0) {
      missingFields.push("Buy Receipt");
    }

  } else {
    // Check Vehicle RC - if either front, back, or combined exists, it's not missing
    if (!hasDocumentPart(docPaths.rc)) missingFields.push("Vehicle RC");
    
    // Check Aadhaar - if either front, back, or combined exists, it's not missing
    if (!hasDocumentPart(docPaths.aadhaar)) missingFields.push("Aadhar");
    
    if (!docPaths.signedDocSell) missingFields.push("Signed Doc");
    if (!docPaths.pan) missingFields.push("PAN Card");
    
    // Check Transfer Receipt
    if (!docPaths.transferReceiptPages || docPaths.transferReceiptPages.length === 0) {
      missingFields.push("Transfer Receipt");
    }
  }

  return { ...letter, missingFields };
};

exports.getIncompleteLetters = async (req, res) => {
  try {
    // Fetch all buy and sell letters, sorted by updatedAt (latest first)
    const [allBuyLetters, allSellLetters] = await Promise.all([
      BuyLetter.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(2000).lean(),
      SellLetter.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(2000).lean(),
    ]);

    // Create a map to store only the latest version of each registration number
    const buyLetterMap = new Map();
    allBuyLetters.forEach(letter => {
      const regNo = letter.registrationNumber;
      if (!buyLetterMap.has(regNo)) {
        buyLetterMap.set(regNo, letter);
      }
    });

    const sellLetterMap = new Map();
    allSellLetters.forEach(letter => {
      const regNo = letter.registrationNumber;
      if (!sellLetterMap.has(regNo)) {
        sellLetterMap.set(regNo, letter);
      }
    });

    // Get latest buy letters and filter for incomplete ones
    const latestBuyLetters = Array.from(buyLetterMap.values());
    const incompleteBuy = latestBuyLetters
      .map(l => getIncompleteLetterSummary(l, "buy"))
      .filter(l => l.missingFields.length > 0);

    // Get latest sell letters and filter for incomplete ones
    const latestSellLetters = Array.from(sellLetterMap.values());
    const incompleteSell = latestSellLetters
      .map(l => getIncompleteLetterSummary(l, "sell"))
      .filter(sellLetter => {
        if (sellLetter.missingFields.length === 0) return false;

        const buyLetter = buyLetterMap.get(sellLetter.registrationNumber);
        if (!buyLetter) return true; // No corresponding buy letter, so it's incomplete on its own.

        const buySummary = getIncompleteLetterSummary(buyLetter, "buy");
        if (buySummary.missingFields.length === 0) {
          // The buy letter was complete. 
          // Check if the sell letter is missing sell-specific fields
          const isMissingSellSpecific = sellLetter.missingFields.some(f => 
            ["Signed Doc", "Transfer Receipt"].includes(f)
          );
          if (isMissingSellSpecific) return true;

          // Otherwise, don't show it as incomplete if it's just newly created.
          return false;
        }

        // If the buy letter was also incomplete, show the sell letter.
        return true;
      });

    res.status(200).json({
      success: true,
      data: {
        incompleteBuy,
        incompleteSell,
      },
    });
  } catch (error) {
    console.error("Error fetching incomplete letters:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getOwnerDashboardStats = async (req, res) => {
  try {
    const isPrivileged = req.user.role === "staff" || req.user.role === "admin";
    const ownerId = req.user.id;

    const matchCriteria = isPrivileged ? {} : { user: mongoose.Types.ObjectId(ownerId) };

    const [
      buyStats,
      sellStats,
      serviceStats,
      monthlyBuyData,
      monthlySellData,
      monthlyServiceData,
    ] = await Promise.all([
      BuyLetter.aggregate([
        { $match: buyMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$saleAmount" },
          },
        },
      ]),
      SellLetter.aggregate([
        { $match: sellMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$saleAmount" },
          },
        },
      ]),
      Service.aggregate([
        { $match: serviceMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$grandTotal" },
          },
        },
      ]),
      getMonthlyData(BuyLetter, buyMatch),
      getMonthlyData(SellLetter, sellMatch),
      getMonthlyData(Service, serviceMatch),
    ]);

    const [recentBuy, recentSell, recentService, recentAdvance] =
      await Promise.all([
        getRecentTransactions(BuyLetter, 3, {
          user: mongoose.Types.ObjectId(ownerId),
        }),
        getRecentTransactions(SellLetter, 3, {
          user: mongoose.Types.ObjectId(ownerId),
        }),
        getRecentTransactions(Service, 3, {
          user: mongoose.Types.ObjectId(ownerId),
        }),
        getRecentTransactions(Advance, 2, {
          user: mongoose.Types.ObjectId(ownerId),
        }),
      ]);

    const monthlyData = [];
    const months = [
      ...new Set([
        ...monthlyBuyData.map((item) => item.month),
        ...monthlySellData.map((item) => item.month),
        ...monthlyServiceData.map((item) => item.month),
      ]),
    ];

    months.forEach((month) => {
      const buyMonth = monthlyBuyData.find((item) => item.month === month);
      const sellMonth = monthlySellData.find((item) => item.month === month);
      const serviceMonth = monthlyServiceData.find(
        (item) => item.month === month,
      );

      monthlyData.push({
        month,
        buy: buyMonth ? buyMonth.count : 0,
        sell: sellMonth ? sellMonth.count : 0,
        service: serviceMonth ? serviceMonth.count : 0,
        buyAmount: buyMonth ? buyMonth.totalAmount : 0,
        sellAmount: sellMonth ? sellMonth.totalAmount : 0,
        serviceAmount: serviceMonth ? serviceMonth.totalAmount : 0,
        profit:
          (sellMonth?.totalAmount || 0) +
          (serviceMonth?.totalAmount || 0) -
          (buyMonth?.totalAmount || 0),
      });
    });

    const totalBuyLetters = buyStats.length > 0 ? buyStats[0].count : 0;
    const totalBuyValue = buyStats.length > 0 ? buyStats[0].totalAmount : 0;
    const totalSellLetters = sellStats.length > 0 ? sellStats[0].count : 0;
    const totalSellValue = sellStats.length > 0 ? sellStats[0].totalAmount : 0;
    const totalServices = serviceStats.length > 0 ? serviceStats[0].count : 0;
    const totalServiceValue =
      serviceStats.length > 0 ? serviceStats[0].totalAmount : 0;

    const totalRevenue = totalSellValue + totalServiceValue;
    const totalExpenses = totalBuyValue;
    const profit = totalRevenue - totalExpenses;
    const profitPercentage =
      totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalBuyLetters,
        totalSellLetters,
        totalServices,
        totalBuyValue,
        totalSellValue,
        totalServiceValue,
        totalRevenue,
        totalExpenses,
        profit,
        profitPercentage,
        ownerName: req.user.name,
        recentTransactions: {
          buy: recentBuy,
          sell: recentSell,
          service: recentService,
          advance: recentAdvance,
        },
        monthlyData,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      buyStats,
      sellStats,
      serviceStats,
      monthlyBuyData,
      monthlySellData,
      monthlyServiceData,
    ] = await Promise.all([
      BuyLetter.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalValue: { $sum: "$saleAmount" },
          },
        },
      ]),
      SellLetter.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalValue: { $sum: "$saleAmount" },
          },
        },
      ]),
      Service.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalValue: { $sum: "$grandTotal" },
          },
        },
      ]),
      getMonthlyData(BuyLetter),
      getMonthlyData(SellLetter),
      getMonthlyData(Service),
    ]);

    const [recentBuy, recentSell, recentService, recentAdvance] =
      await Promise.all([
        getRecentTransactions(BuyLetter),
        getRecentTransactions(SellLetter),
        getRecentTransactions(Service),
        getRecentTransactions(Advance, 2),
      ]);

    const monthlyData = [];
    const months = [
      ...new Set([
        ...monthlyBuyData.map((item) => item.month),
        ...monthlySellData.map((item) => item.month),
        ...monthlyServiceData.map((item) => item.month),
      ]),
    ];

    months.forEach((month) => {
      const buyMonth = monthlyBuyData.find((item) => item.month === month);
      const sellMonth = monthlySellData.find((item) => item.month === month);
      const serviceMonth = monthlyServiceData.find(
        (item) => item.month === month,
      );

      monthlyData.push({
        month,
        buy: buyMonth ? buyMonth.count : 0,
        sell: sellMonth ? sellMonth.count : 0,
        service: serviceMonth ? serviceMonth.count : 0,
        buyAmount: buyMonth ? buyMonth.totalAmount : 0,
        sellAmount: sellMonth ? sellMonth.totalAmount : 0,
        serviceAmount: serviceMonth ? serviceMonth.totalAmount : 0,
        profit:
          (sellMonth?.totalAmount || 0) +
          (serviceMonth?.totalAmount || 0) -
          (buyMonth?.totalAmount || 0),
      });
    });

    const totalBuyLetters = buyStats.length > 0 ? buyStats[0].count : 0;
    const totalBuyValue = buyStats.length > 0 ? buyStats[0].totalValue : 0;
    const totalSellLetters = sellStats.length > 0 ? sellStats[0].count : 0;
    const totalSellValue = sellStats.length > 0 ? sellStats[0].totalValue : 0;
    const totalServices = serviceStats.length > 0 ? serviceStats[0].count : 0;
    const totalServiceValue =
      serviceStats.length > 0 ? serviceStats[0].totalValue : 0;

    const totalRevenue = totalSellValue + totalServiceValue;
    const totalExpenses = totalBuyValue;
    const profit = totalRevenue - totalExpenses;
    const profitPercentage =
      totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;

    if (req.user.role === "staff") {
      res.status(200).json({
        success: true,
        data: {
          totalBuyLetters,
          totalSellLetters,
          totalServices,
          totalAdvanceBills: recentAdvance.length,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          totalBuyLetters,
          totalSellLetters,
          totalServices,
          totalBuyValue,
          totalSellValue,
          totalServiceValue,
          totalRevenue,
          totalExpenses,
          profit,
          profitPercentage,
          ownerName: req.user?.name || "",
          recentTransactions: {
            buy: recentBuy,
            sell: recentSell,
            service: recentService,
            advance: recentAdvance,
          },
          monthlyData,
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Returns sold vehicles with their first three service bill dates (free services usage)
// Supports optional query params: `limit` (default 10) and `search` (registrationNumber partial, case-insensitive)
exports.getFreeServiceUsage = async (req, res) => {
  try {
    const { limit = 10, search } = req.query;
    const numericLimit = Math.max(1, Math.min(2000, parseInt(limit, 10) || 10));

    // Build a base match for sold vehicles (SellLetter)
    const baseMatch = {};
    if (search && String(search).trim() !== "") {
      const regex = new RegExp(
        String(search)
          .trim()
          .replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
        "i",
      );
      baseMatch.registrationNumber = { $regex: regex };
    }

    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "servicebills",
          let: { reg: "$registrationNumber", saleDate: "$saleDate" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$registrationNumber", "$$reg"] },
                    { $gte: ["$serviceDate", "$$saleDate"] },
                    { $in: ["$serviceType", ["custom", "free"]] },
                  ],
                },
              },
            },
            { $sort: { serviceDate: 1, createdAt: 1 } },
            { $project: { serviceDate: 1, vehicleBrand: 1, vehicleModel: 1 } },
          ],
          as: "services",
        },
      },
      // Keep all sold vehicles (even if they have zero services)
      {
        $project: {
          saleDate: 1,
          buyerName: 1,
          buyerPhone: 1,
          registrationNumber: 1,
          vehicleBrand: {
            $ifNull: [
              { $arrayElemAt: ["$services.vehicleBrand", 0] },
              "$vehicleName",
            ],
          },
          vehicleModel: {
            $ifNull: [
              { $arrayElemAt: ["$services.vehicleModel", 0] },
              "$vehicleModel",
            ],
          },
          serviceDates: {
            $map: {
              input: "$services",
              as: "s",
              in: "$$s.serviceDate",
            },
          },
        },
      },
      {
        $addFields: {
          // Use actual service date if present; otherwise project based on saleDate + n months
          month1: {
            $ifNull: [
              { $arrayElemAt: ["$serviceDates", 0] },
              {
                $dateAdd: { startDate: "$saleDate", unit: "month", amount: 1 },
              },
            ],
          },
          month2: {
            $ifNull: [
              { $arrayElemAt: ["$serviceDates", 1] },
              {
                $dateAdd: { startDate: "$saleDate", unit: "month", amount: 2 },
              },
            ],
          },
          month3: {
            $ifNull: [
              { $arrayElemAt: ["$serviceDates", 2] },
              {
                $dateAdd: { startDate: "$saleDate", unit: "month", amount: 3 },
              },
            ],
          },
          usedCount: { $size: { $ifNull: ["$serviceDates", []] } },
        },
      },
      {
        $addFields: {
          projectedMonths: ["$month1", "$month2", "$month3"],
          nextDue: {
            $arrayElemAt: [["$month1", "$month2", "$month3"], "$usedCount"],
          },
        },
      },
      { $sort: { saleDate: -1 } },
      { $limit: numericLimit },
    ];

    const results = await SellLetter.aggregate(pipeline).allowDiskUse(true);

    if (results.length > 0) {
      console.log("Debug FreeServiceUsage Result Sample:", {
        reg: results[0].registrationNumber,
        buyer: results[0].buyerName,
        phone: results[0].buyerPhone,
        fullObj: JSON.stringify(results[0]).slice(0, 200),
      });
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getPucExpiryReminders = async (req, res) => {
  try {
    const { limit = 100, search } = req.query;
    const numericLimit = parseInt(limit, 10);

    // Date Logic: Expiry <= Today + 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // ── PUC is the SINGLE SOURCE OF TRUTH ──
    // Query master PUC records only — the SellLetter/BuyLetter stale copies are NOT used.
    const pucBase = {
      $or: [
        { pucExpiry: { $exists: true, $ne: null, $lte: sevenDaysFromNow } },
        { pucExpiryDate: { $exists: true, $ne: null, $lte: sevenDaysFromNow } },
      ],
    };

    if (search && String(search).trim() !== "") {
      const escaped = String(search).trim().replace(/[-/\\^+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      pucBase.$and = [
        {
          $or: [
            { regNo: { $regex: regex } },
            { vehicleRegNo: { $regex: regex } },
            { personName: { $regex: regex } },
            { brand: { $regex: regex } },
            { vehicleModel: { $regex: regex } },
          ],
        },
      ];
    }

    const pucRecords = await PUC.find(pucBase)
      .select("regNo vehicleRegNo personName personPhone personAlternateNo brand vehicleModel pucExpiry pucExpiryDate")
      .sort({ pucExpiry: 1, pucExpiryDate: 1 })
      .limit(numericLimit * 2)
      .lean();

    // For each PUC record, check if there is a matching SellLetter to determine context (sold vs. buy/standalone)
    const allRegNos = pucRecords.map((p) => (p.vehicleRegNo || p.regNo || "").trim());
    const uniqueRegNos = [...new Set(allRegNos.filter(Boolean))];

    // Load matching sell letters to classify records as "Sold Vehicle"
    const sellLetterMap = {};
    if (uniqueRegNos.length > 0) {
      const sellMatches = await SellLetter.find({
        registrationNumber: { $in: uniqueRegNos.map((r) => new RegExp(`^${r}$`, "i")) },
      })
        .select("registrationNumber buyerName buyerPhone vehicleName vehicleModel")
        .lean();
      for (const s of sellMatches) {
        const key = (s.registrationNumber || "").trim().toLowerCase();
        if (!sellLetterMap[key]) sellLetterMap[key] = s;
      }
    }

    const finalData = pucRecords
      .map((p) => {
        const regNo = (p.vehicleRegNo || p.regNo || "").trim();
        const regKey = regNo.toLowerCase();
        const sell = sellLetterMap[regKey];
        const expiry = p.pucExpiry || p.pucExpiryDate;
        return {
          _id: p._id,
          source: sell ? "Sold Vehicle" : "PUC Record",
          type: sell ? "sold_vehicle" : "puc_model",
          displayReg: regNo || p.regNo,
          displayName: sell ? sell.buyerName : p.personName,
          displayPhone: sell ? sell.buyerPhone : p.personPhone,
          displayVehicle: sell
            ? `${sell.vehicleName || ""} ${sell.vehicleModel || ""}`.trim()
            : `${p.brand || ""} ${p.vehicleModel || ""}`.trim(),
          displayExpiry: expiry,
          // expose the master PUC id so frontend can deep-link to PUC module
          pucId: p._id,
        };
      })
      .filter((item) => item.type === "sold_vehicle"); // Only show sold vehicles

    finalData.sort((a, b) => new Date(a.displayExpiry) - new Date(b.displayExpiry));
    const sliced = finalData.slice(0, numericLimit);

    res.status(200).json({ success: true, data: sliced });
  } catch (err) {
    console.error("Error in getPucExpiryReminders:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getInsuranceExpiryReminders = async (req, res) => {
  try {
    const { limit = 100, search } = req.query;
    const numericLimit = parseInt(limit, 10);

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // ── Insurance is the SINGLE SOURCE OF TRUTH ──
    // Query master Insurance records only — the SellLetter/BuyLetter stale copies are NOT used.
    const insBase = {
      $or: [
        { insuranceExpiry: { $exists: true, $ne: null, $lte: sevenDaysFromNow } },
        { insuranceExpiryDate: { $exists: true, $ne: null, $lte: sevenDaysFromNow } },
      ],
    };

    if (search && String(search).trim() !== "") {
      const escaped = String(search).trim().replace(/[-/\\^+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      insBase.$and = [
        {
          $or: [
            { regNo: { $regex: regex } },
            { vehicleRegNo: { $regex: regex } },
            { personName: { $regex: regex } },
            { brand: { $regex: regex } },
            { vehicleModel: { $regex: regex } },
            { insuranceCompany: { $regex: regex } },
          ],
        },
      ];
    }

    const insRecords = await Insurance.find(insBase)
      .select("regNo vehicleRegNo personName personPhone personAlternateNo brand vehicleModel insuranceExpiry insuranceExpiryDate insuranceCompany")
      .sort({ insuranceExpiry: 1, insuranceExpiryDate: 1 })
      .limit(numericLimit * 2)
      .lean();

    // For each Insurance record, check if there is a matching SellLetter to determine context
    const allRegNos = insRecords.map((i) => (i.vehicleRegNo || i.regNo || "").trim());
    const uniqueRegNos = [...new Set(allRegNos.filter(Boolean))];

    const sellLetterMap = {};
    if (uniqueRegNos.length > 0) {
      const sellMatches = await SellLetter.find({
        registrationNumber: { $in: uniqueRegNos.map((r) => new RegExp(`^${r}$`, "i")) },
      })
        .select("registrationNumber buyerName buyerPhone vehicleName vehicleModel")
        .lean();
      for (const s of sellMatches) {
        const key = (s.registrationNumber || "").trim().toLowerCase();
        if (!sellLetterMap[key]) sellLetterMap[key] = s;
      }
    }

    const finalData = insRecords
      .map((ins) => {
        const regNo = (ins.vehicleRegNo || ins.regNo || "").trim();
        const regKey = regNo.toLowerCase();
        const sell = sellLetterMap[regKey];
        const expiry = ins.insuranceExpiry || ins.insuranceExpiryDate;
        return {
          _id: ins._id,
          source: sell ? "Sold Vehicle" : "Insurance Record",
          type: sell ? "sold_vehicle" : "insurance_model",
          displayReg: regNo || ins.regNo,
          displayName: sell ? sell.buyerName : ins.personName,
          displayPhone: sell ? sell.buyerPhone : ins.personPhone,
          displayVehicle: sell
            ? `${sell.vehicleName || ""} ${sell.vehicleModel || ""}`.trim()
            : `${ins.brand || ""} ${ins.vehicleModel || ""}`.trim(),
          displayExpiry: expiry,
          displayCompany: ins.insuranceCompany,
          // expose master Insurance id so frontend can deep-link to Insurance module
          insuranceId: ins._id,
        };
      })
      .filter((item) => item.type === "sold_vehicle"); // Only show sold vehicles

    finalData.sort((a, b) => new Date(a.displayExpiry) - new Date(b.displayExpiry));
    const sliced = finalData.slice(0, numericLimit);

    res.status(200).json({ success: true, data: sliced });
  } catch (err) {
    console.error("Error in getInsuranceExpiryReminders:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
