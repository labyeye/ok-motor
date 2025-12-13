const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const readline = require("readline");
const User = require("../models/User");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify question
const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
const isStrongPassword = (password) => {
  return password.length >= 8;
};

const createAdmin = async () => {
  try {
    console.log("\n🔐 OK Motor - Admin User Creation Script\n");
    console.log("=========================================\n");

    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI not found in .env file");
      console.log("\nPlease ensure you have a .env file in the backend directory with:");
      console.log("MONGO_URI=your_mongodb_connection_string\n");
      rl.close();
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected successfully\n");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}\n`);

      const overwrite = await question(
        "Do you want to create another admin? (yes/no): "
      );

      if (
        overwrite.toLowerCase() !== "yes" &&
        overwrite.toLowerCase() !== "y"
      ) {
        console.log("\n❌ Admin creation cancelled.\n");
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      }
    }

    // Get admin details from user input
    let name, email, password, confirmPassword;

    // Get name
    name = await question("\nEnter admin name: ");
    while (!name || name.trim().length < 2) {
      console.log("❌ Name must be at least 2 characters long");
      name = await question("Enter admin name: ");
    }

    // Get email
    email = await question("Enter admin email: ");
    while (!isValidEmail(email)) {
      console.log("❌ Invalid email format");
      email = await question("Enter admin email: ");
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      console.log(`\n❌ Email ${email} is already registered!\n`);
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Get password (note: password will be visible in terminal)
    password = await question("Enter admin password (min 8 characters): ");
    while (!isStrongPassword(password)) {
      console.log("❌ Password must be at least 8 characters long");
      password = await question("Enter admin password (min 8 characters): ");
    }

    confirmPassword = await question("Confirm password: ");
    while (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      confirmPassword = await question("Confirm password: ");
    }

    // Create admin user
    const admin = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: "admin",
      status: "active",
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!\n");
    console.log("Admin Details:");
    console.log("==============");
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log(`ID:    ${admin._id}\n`);
    console.log("🚀 You can now login to the dashboard with these credentials.\n");

    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating admin user:", error.message);
    rl.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Handle cleanup on exit
process.on("SIGINT", async () => {
  console.log("\n\n❌ Admin creation cancelled by user.\n");
  rl.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

createAdmin();
