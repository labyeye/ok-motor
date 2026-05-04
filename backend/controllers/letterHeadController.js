const LetterHead = require("../models/LetterHead");
const asyncHandler = require("express-async-handler");

const createLetterHead = asyncHandler(async (req, res) => {
  const { date, to, subject, message } = req.body;

  if (!date || !to || !subject || !message) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  const letterHead = await LetterHead.create({
    user: req.user._id,
    date,
    to,
    subject,
    message,
  });

  if (letterHead) {
    res.status(201).json({
      success: true,
      data: letterHead,
    });
  } else {
    res.status(400);
    throw new Error("Invalid letter head data");
  }
});

const getLetterHeads = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.pageNumber) || 1;

  const count = await LetterHead.countDocuments({});
  const letterHeads = await LetterHead.find({})
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("user", "name email");

  res.json({
    success: true,
    data: letterHeads,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

const getLetterHeadById = asyncHandler(async (req, res) => {
  const letterHead = await LetterHead.findById(req.params.id).populate(
    "user",
    "name email",
  );

  if (letterHead) {
    res.json({
      success: true,
      data: letterHead,
    });
  } else {
    res.status(404);
    throw new Error("Letter head not found");
  }
});

const updateLetterHead = asyncHandler(async (req, res) => {
  const letterHead = await LetterHead.findById(req.params.id);

  if (letterHead) {
    letterHead.date = req.body.date || letterHead.date;
    letterHead.to = req.body.to || letterHead.to;
    letterHead.subject = req.body.subject || letterHead.subject;
    letterHead.message = req.body.message || letterHead.message;

    const updatedLetterHead = await letterHead.save();
    res.json({
      success: true,
      data: updatedLetterHead,
    });
  } else {
    res.status(404);
    throw new Error("Letter head not found");
  }
});

const deleteLetterHead = asyncHandler(async (req, res) => {
  const letterHead = await LetterHead.findById(req.params.id);

  if (letterHead) {
    await letterHead.deleteOne();
    res.json({ message: "Letter head removed" });
  } else {
    res.status(404);
    throw new Error("Letter head not found");
  }
});

module.exports = {
  createLetterHead,
  getLetterHeads,
  getLetterHeadById,
  updateLetterHead,
  deleteLetterHead,
};
