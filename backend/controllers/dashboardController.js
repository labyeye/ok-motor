const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");
const Service = require("../models/ServiceBill");
const Advance = require("../models/AdvanceBill");
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
        }))
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
        }))
      );
  } else if (model.modelName === "ServiceBill") {
    return model
      .find(matchCriteria)
      .sort({ serviceDate: -1, createdAt: -1 })
      .limit(limit)
      .select(
        "customerName serviceDate grandTotal registrationNumber serviceType"
      )
      .lean()
      .then((docs) =>
        docs.map((doc) => ({
          name: doc.customerName,
          date: doc.serviceDate,
          amount: doc.grandTotal,
          vehicle: doc.registrationNumber,
          serviceType: doc.serviceType,
        }))
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
        }))
      );
  }

  return model
    .find(matchCriteria)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .select(selectFields)
    .lean();
};
exports.getOwnerDashboardStats = async (req, res) => {
  try {
    const isPrivileged = req.user.role === "staff" || req.user.role === "admin";
    const buyMatch = isPrivileged
      ? {}
      : { user: mongoose.Types.ObjectId(req.user.id) };
    const sellMatch = isPrivileged
      ? {}
      : { user: mongoose.Types.ObjectId(req.user.id) };
    const serviceMatch = isPrivileged
      ? {}
      : { user: mongoose.Types.ObjectId(req.user.id) };

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
        (item) => item.month === month
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
        (item) => item.month === month
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
    const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    // Build a base match for sold vehicles (SellLetter)
    const baseMatch = {};
    if (search && String(search).trim() !== "") {
      const regex = new RegExp(String(search).trim().replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
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
          registrationNumber: 1,
          vehicleBrand: {
            $ifNull: [{ $arrayElemAt: ["$services.vehicleBrand", 0] }, "$vehicleName"],
          },
          vehicleModel: {
            $ifNull: [{ $arrayElemAt: ["$services.vehicleModel", 0] }, "$vehicleModel"],
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
              { $dateAdd: { startDate: "$saleDate", unit: "month", amount: 1 } },
            ],
          },
          month2: {
            $ifNull: [
              { $arrayElemAt: ["$serviceDates", 1] },
              { $dateAdd: { startDate: "$saleDate", unit: "month", amount: 2 } },
            ],
          },
          month3: {
            $ifNull: [
              { $arrayElemAt: ["$serviceDates", 2] },
              { $dateAdd: { startDate: "$saleDate", unit: "month", amount: 3 } },
            ],
          },
          usedCount: { $size: { $ifNull: ["$serviceDates", []] } },
        },
      },
      {
        $addFields: {
          projectedMonths: ["$month1", "$month2", "$month3"],
          nextDue: { $arrayElemAt: [["$month1", "$month2", "$month3"], "$usedCount"] },
        },
      },
      { $sort: { saleDate: -1 } },
      { $limit: numericLimit },
    ];

    const results = await SellLetter.aggregate(pipeline).allowDiskUse(true);

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
