const mongoose = require('mongoose');
require('dotenv').config();

const resetDb = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rydzo';
        console.log(`Connecting to ${mongoUri}...`);

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        console.log('⚠️  DELETING ALL DATA...');

        // Get all collections
        const collections = await mongoose.connection.db.collections();

        for (let collection of collections) {
            await collection.drop();
            console.log(`   - Dropped collection: ${collection.collectionName}`);
        }

        console.log('✅ ALL DATA DELETED SUCCESSFULLY');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

resetDb();
