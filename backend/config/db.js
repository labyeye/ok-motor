const mongoose = require("mongoose");

// Amounts typed as "19,000" or "₹ 19,000" must save as numbers on every model
// (create, save and findByIdAndUpdate). Runs before any schema is built.
mongoose.Schema.Types.Number.setters.push((v) =>
  typeof v === "string" ? v.replace(/[,\s₹]/g, "") : v,
);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
