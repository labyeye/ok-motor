const Insurance = require("../models/Insurance");

exports.createInsurance = async (req, res) => {
  try {
    const insuranceData = {
      ...req.body,
      user: req.user.id,
    };

    const insurance = new Insurance(insuranceData);
    const savedInsurance = await insurance.save();

    res.status(201).json(savedInsurance);
  } catch (error) {
    console.error("Error creating insurance:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Duplicate entry for Registration Number or other unique field",
        error: error.message,
      });
    }
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getAllInsurance = async (req, res) => {
  try {
    const { limit = 1000 } = req.query; // Default large limit if not specified
    const insuranceList = await Insurance.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(insuranceList);
  } catch (error) {
    console.error("Error fetching insurance:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({ message: "Insurance record not found" });
    }

    // Optional: Check permissions (e.g., only admin or owner)
    // if (req.user.role !== 'admin') ...

    await insurance.deleteOne();
    res.json({ message: "Insurance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting insurance:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.updateInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({ message: "Insurance record not found" });
    }

    const updatedInsurance = await Insurance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedInsurance);
  } catch (error) {
    console.error("Error updating insurance:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
