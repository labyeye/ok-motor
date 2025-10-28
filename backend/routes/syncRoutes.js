// routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const BuyLetter = require('../models/BuyLetter');
const SellLetter = require('../models/SellLetter');
const ServiceBill = require('../models/ServiceBill');
const AdvanceBill = require('../models/AdvanceBill');

// Model mapping
const modelMap = {
  buyLetters: BuyLetter,
  sellLetters: SellLetter,
  serviceBills: ServiceBill,
  advanceBills: AdvanceBill
};

/**
 * @route   POST /api/sync/:collection
 * @desc    Sync offline data for a specific collection
 * @access  Private
 */
router.post('/:collection', protect, asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const { documents } = req.body;

  if (!modelMap[collection]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid collection name'
    });
  }

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No documents provided for sync'
    });
  }

  const Model = modelMap[collection];
  const syncedIds = [];
  const errors = [];

  try {
    for (const doc of documents) {
      try {
        // Remove offline-specific fields
        const { synced, localOnly, syncedAt, ...cleanDoc } = doc;

        // Validate _id format (must be 24 character hex string)
        const isValidObjectId = doc._id && 
                                typeof doc._id === 'string' && 
                                doc._id.length === 24 && 
                                /^[0-9a-fA-F]{24}$/.test(doc._id);

        // Check if document already exists
        let existingDoc = null;
        if (isValidObjectId) {
          try {
            existingDoc = await Model.findById(doc._id);
          } catch (err) {
            console.error(`Invalid ObjectId ${doc._id}:`, err.message);
            existingDoc = null;
          }
        }

        if (existingDoc) {
          // Update existing document
          Object.assign(existingDoc, cleanDoc);
          existingDoc.updatedAt = new Date();
          await existingDoc.save();
          syncedIds.push(doc._id);
        } else {
          // Create new document
          const newDoc = new Model(cleanDoc);
          
          // Only set _id if it's a valid ObjectId format
          if (isValidObjectId) {
            newDoc._id = doc._id;
          }
          // Otherwise, let MongoDB generate a new _id
          
          // Add user field if not present (required by most models)
          if (!newDoc.user && req.user && req.user.id) {
            newDoc.user = req.user.id;
          }
          
          await newDoc.save();
          syncedIds.push(newDoc._id.toString());
        }
      } catch (error) {
        console.error(`Error syncing document:`, error);
        errors.push({
          documentId: doc._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedIds.length} documents`,
      syncedIds,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: documents.length,
      totalSynced: syncedIds.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during sync',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/sync/status
 * @desc    Get sync status for all collections
 * @access  Private
 */
router.get('/status', protect, asyncHandler(async (req, res) => {
  try {
    const status = {};

    for (const [collectionName, Model] of Object.entries(modelMap)) {
      const count = await Model.countDocuments({ user: req.user._id });
      const recent = await Model.find({ user: req.user._id })
        .sort({ updatedAt: -1 })
        .limit(1)
        .select('updatedAt');

      status[collectionName] = {
        count,
        lastUpdated: recent.length > 0 ? recent[0].updatedAt : null
      };
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting sync status',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/sync/batch
 * @desc    Sync multiple collections in one request
 * @access  Private
 */
router.post('/batch', protect, asyncHandler(async (req, res) => {
  const { collections } = req.body;

  if (!collections || typeof collections !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Invalid batch sync request'
    });
  }

  const results = {};

  for (const [collectionName, documents] of Object.entries(collections)) {
    if (!modelMap[collectionName]) {
      results[collectionName] = {
        success: false,
        message: 'Invalid collection name'
      };
      continue;
    }

    if (!Array.isArray(documents)) {
      results[collectionName] = {
        success: false,
        message: 'Documents must be an array'
      };
      continue;
    }

    const Model = modelMap[collectionName];
    const syncedIds = [];
    const errors = [];

    try {
      for (const doc of documents) {
        try {
          const { synced, localOnly, syncedAt, ...cleanDoc } = doc;

          let existingDoc = null;
          if (doc._id) {
            existingDoc = await Model.findById(doc._id);
          }

          if (existingDoc) {
            Object.assign(existingDoc, cleanDoc);
            existingDoc.updatedAt = new Date();
            await existingDoc.save();
            syncedIds.push(doc._id);
          } else {
            const newDoc = new Model(cleanDoc);
            if (doc._id && doc._id.length === 24) {
              newDoc._id = doc._id;
            }
            await newDoc.save();
            syncedIds.push(newDoc._id.toString());
          }
        } catch (error) {
          errors.push({
            documentId: doc._id,
            error: error.message
          });
        }
      }

      results[collectionName] = {
        success: true,
        syncedIds,
        errors: errors.length > 0 ? errors : undefined,
        totalSynced: syncedIds.length,
        totalErrors: errors.length
      };
    } catch (error) {
      results[collectionName] = {
        success: false,
        message: error.message
      };
    }
  }

  res.json({
    success: true,
    message: 'Batch sync completed',
    results
  });
}));

/**
 * @route   GET /api/health
 * @desc    Health check endpoint for network detection
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
