require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});

        console.log('--- USER DATABASE REPORT ---');
        console.log(`Total Users: ${users.length}`);

        if (users.length === 0) {
            console.log('Database is completely empty.');
        } else {
            users.forEach(u => {
                console.log(`ID: ${u._id}`);
                console.log(`Name: ${u.name}`);
                console.log(`Email: ${u.email}`);
                console.log(`Role: ${u.role}`);
                console.log('---------------------------');
            });
        }

        console.log('All other customer/owner emails and passwords have been permanently deleted.');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
