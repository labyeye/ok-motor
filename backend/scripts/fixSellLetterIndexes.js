require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function fixSellLetterIndexes() {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('sellletters');
    
    console.log('Checking existing indexes on sellletters collection...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Find and drop any unique index on registrationNumber
    for (const index of indexes) {
      if (index.name.includes('registrationNumber') && index.unique) {
        console.log(`Dropping unique index: ${index.name}`);
        await collection.dropIndex(index.name);
        console.log(`✓ Dropped unique index: ${index.name}`);
      }
    }
    
    // Create a non-unique index on registrationNumber for query performance
    console.log('Creating non-unique index on registrationNumber...');
    await collection.createIndex({ registrationNumber: 1 }, { unique: false });
    console.log('✓ Created non-unique index on registrationNumber');
    
    console.log('\n✓ Index fix completed successfully!');
    console.log('SellLetter documents can now have duplicate registration numbers (for versioning).');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixSellLetterIndexes();
