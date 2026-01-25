const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rydzo';
    console.log(`Connecting to ${mongoUri}...`);

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected\n');

    // Admin user details - 
    const adminData = {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
      isActive: true,
      customerApprovalStatus: 'approved',
      ownerApprovalStatus: 'approved'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { phone: adminData.phone },
        { email: adminData.email },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('⚠️  Admin user already exists!');
        console.log(`   Name: ${existingAdmin.name}`);
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Phone: ${existingAdmin.phone}`);
        // If this is the same admin (email/phone matches), reset password to adminData.password
        if (
          (existingAdmin.email && adminData.email && existingAdmin.email === adminData.email) ||
          (existingAdmin.phone && adminData.phone && existingAdmin.phone === adminData.phone)
        ) {
          existingAdmin.password = adminData.password;
          await existingAdmin.save();
          console.log('\n✅ Admin password has been reset successfully!');
          console.log(`   Login with: Phone: ${existingAdmin.phone} or Email: ${existingAdmin.email}`);
         console.log('   Password: [SET VIA ENV]');
        } else {
          console.log('\n💡 Another admin exists in DB. If you want to reset its password, set adminData.email/phone to match that admin.');
        }
        process.exit(0);
      } else {
        console.log('⚠️  User with this phone/email already exists but is not admin.');
        console.log('   Converting to admin...');
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        existingAdmin.customerApprovalStatus = 'approved';
        existingAdmin.ownerApprovalStatus = 'approved';
      // Also set password so login works with adminData.password
      existingAdmin.password = adminData.password;
        await existingAdmin.save();
        console.log('✅ User converted to admin successfully!');
        console.log(`   Login with: Phone: ${existingAdmin.phone} or Email: ${existingAdmin.email}`);
      console.log('   Password: [SET VIA ENV]');
        process.exit(0);
      }
    }

    // Create new admin user
    console.log('🔄 Creating admin user...');
    const admin = new User(adminData);
    await admin.save();

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Name:', adminData.name);
    console.log('   Email:', adminData.email);
    console.log('   Phone:', adminData.phone);
    console.log('   Password:', adminData.password);
    console.log('\n💡 You can now login with these credentials.');
    console.log('   After login, you will see "Admin Panel" link in navbar.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
