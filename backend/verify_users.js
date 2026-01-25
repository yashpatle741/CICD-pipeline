const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./models/User');
const uri = 'mongodb+srv://rydzoUser:rydzo123@cluster0.ljniqrs.mongodb.net/rydzo';

async function run() {
    try {
        await mongoose.connect(uri);
        const users = await User.find({});
        const output = `Count: ${users.length}\n` + users.map(u => `${u.name} - ${u.role}`).join('\n');
        fs.writeFileSync('verify_output.txt', output);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('verify_output.txt', 'Error: ' + e.message);
        process.exit(1);
    }
}
run();
