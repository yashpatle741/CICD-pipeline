const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const approveAll = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rydzo';
        console.log(`Connecting to ${mongoUri}...`);

        await mongoose.connect(mongoUri);
        console.log(' MongoDB Connected');

        console.log('🔄Approving all users...');

        const result = await User.updateMany(
            {},
            {
                $set: {
                    customerApprovalStatus: 'approved',
                    ownerApprovalStatus: 'approved',
                    isVerified: true
                }
            }
        );

        console.log(` Success! Approved ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error(' Error approving users:', error);
        process.exit(1);
    }
};

approveAll();
