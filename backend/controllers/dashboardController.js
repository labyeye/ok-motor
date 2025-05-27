// dashboardController.js
const BuyLetter = require('../models/BuyLetter');
const SellLetter = require('../models/SellLetter');
const Service = require('../models/ServiceBill'); // Add this if you have a Service model
const mongoose = require('mongoose');

// Helper function to get monthly data
const getMonthlyData = async (model, matchCriteria = {}) => {
  return model.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: "$saleAmount" || "$amount" }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    },
    {
      $project: {
        month: {
          $let: {
            vars: {
              monthsInString: ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            },
            in: {
              $arrayElemAt: ["$$monthsInString", "$_id.month"]
            }
          }
        },
        count: 1,
        totalAmount: 1
      }
    }
  ]);
};

// Helper function to get recent transactions
const getRecentTransactions = async (model, limit = 3, matchCriteria = {}) => {
  return model.find(matchCriteria)
    .sort({ date: -1 })
    .limit(limit)
    .select('bikeNumber customerName date amount serviceType') // Adjust fields as needed
    .lean();
};

exports.getOwnerDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get counts and amounts for buy letters (purchases)
    const [buyStats, sellStats, monthlyBuyData, monthlySellData] = await Promise.all([
      BuyLetter.aggregate([
        { $match: { user: mongoose.Types.ObjectId(ownerId) } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$saleAmount" }
          }
        }
      ]),
      SellLetter.aggregate([
        { $match: { user: mongoose.Types.ObjectId(ownerId) } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$saleAmount" }
          }
        }
      ]),
      getMonthlyData(BuyLetter, { user: mongoose.Types.ObjectId(ownerId) }),
      getMonthlyData(SellLetter, { user: mongoose.Types.ObjectId(ownerId) })
    ]);

    // Get recent transactions
    const [recentBuy, recentSell, recentService] = await Promise.all([
      getRecentTransactions(BuyLetter, 3, { user: mongoose.Types.ObjectId(ownerId) }),
      getRecentTransactions(SellLetter, 3, { user: mongoose.Types.ObjectId(ownerId) }),
      getRecentTransactions(Service, 3, { user: mongoose.Types.ObjectId(ownerId) })
    ]);

    // Combine monthly data
    const monthlyData = [];
    const months = [...new Set([
      ...monthlyBuyData.map(item => item.month),
      ...monthlySellData.map(item => item.month)
    ])];

    months.forEach(month => {
      const buyMonth = monthlyBuyData.find(item => item.month === month);
      const sellMonth = monthlySellData.find(item => item.month === month);
      
      monthlyData.push({
        month,
        buy: buyMonth ? buyMonth.count : 0,
        sell: sellMonth ? sellMonth.count : 0,
        profit: (sellMonth?.totalAmount || 0) - (buyMonth?.totalAmount || 0)
      });
    });

    const totalBuyLetters = buyStats.length > 0 ? buyStats[0].count : 0;
    const totalBuyValue = buyStats.length > 0 ? buyStats[0].totalAmount : 0;
    const totalSellLetters = sellStats.length > 0 ? sellStats[0].count : 0;
    const totalSellValue = sellStats.length > 0 ? sellStats[0].totalAmount : 0;
    const profit = totalSellValue - totalBuyValue;

    res.status(200).json({
      success: true,
      data: {
        totalBuyLetters,
        totalSellLetters,
        totalBuyValue,
        totalSellValue,
        profit,
        ownerName: req.user.name,
        recentTransactions: {
          buy: recentBuy,
          sell: recentSell,
          service: recentService
        },
        monthlyData
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalBuyLetters, totalSellLetters, buyResult, sellResult, monthlyBuyData, monthlySellData] = await Promise.all([
      BuyLetter.countDocuments(),
      SellLetter.countDocuments(),
      BuyLetter.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$saleAmount" }
          }
        }
      ]),
      SellLetter.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$saleAmount" }
          }
        }
      ]),
      getMonthlyData(BuyLetter),
      getMonthlyData(SellLetter)
    ]);

    // Get recent transactions
    const [recentBuy, recentSell, recentService] = await Promise.all([
      getRecentTransactions(BuyLetter),
      getRecentTransactions(SellLetter),
      getRecentTransactions(Service)
    ]);

    // Combine monthly data
    const monthlyData = [];
    const months = [...new Set([
      ...monthlyBuyData.map(item => item.month),
      ...monthlySellData.map(item => item.month)
    ])];

    months.forEach(month => {
      const buyMonth = monthlyBuyData.find(item => item.month === month);
      const sellMonth = monthlySellData.find(item => item.month === month);
      
      monthlyData.push({
        month,
        buy: buyMonth ? buyMonth.count : 0,
        sell: sellMonth ? sellMonth.count : 0,
        profit: (sellMonth?.totalAmount || 0) - (buyMonth?.totalAmount || 0)
      });
    });

    const totalBuyValue = buyResult.length > 0 ? buyResult[0].totalValue : 0;
    const totalSellValue = sellResult.length > 0 ? sellResult[0].totalValue : 0;
    const profit = totalSellValue - totalBuyValue;

    res.status(200).json({
      success: true,
      data: {
        totalBuyLetters,
        totalSellLetters,
        totalBuyValue,
        totalSellValue,
        profit,
        recentTransactions: {
          buy: recentBuy,
          sell: recentSell,
          service: recentService
        },
        monthlyData
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};