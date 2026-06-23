const sequelize = require('../config/database');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Sync database
    await sequelize.sync();
    console.log('Database synced successfully');

    // Check if admin already exists
    const adminExists = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin'
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: Admin@123');
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
