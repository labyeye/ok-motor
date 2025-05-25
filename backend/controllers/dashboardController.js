// dashboardController.js
const BuyLetter = require('../models/BuyLetter');
const SellLetter = require('../models/SellLetter');
const mongoose = require('mongoose');

exports.getOwnerDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user.id; // Assuming owner is the logged-in user

    // Get counts and amounts for buy letters (purchases)
    const buyStats = await BuyLetter.aggregate([
      { $match: { user: mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$saleAmount" }
        }
      }
    ]);

    // Get counts and amounts for sell letters (sales)
    const sellStats = await SellLetter.aggregate([
      { $match: { user: mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$saleAmount" }
        }
      }
    ]);

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
        ownerName: req.user.name
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
    const totalBuyLetters = await BuyLetter.countDocuments();
    const totalSellLetters = await SellLetter.countDocuments();
    
    const buyResult = await BuyLetter.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$saleAmount" }
        }
      }
    ]);

    const sellResult = await SellLetter.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$saleAmount" }
        }
      }
    ]);

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
        profit
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