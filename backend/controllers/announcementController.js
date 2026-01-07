const Announcement = require("../models/Announcement");

exports.createAnnouncement = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { message, link, active, startDate, endDate } = req.body;
    // If activating this announcement, deactivate others (simple policy)
    if (active) {
      await Announcement.updateMany({}, { active: false });
    }

    const ann = await Announcement.create({
      message,
      link,
      active: !!active,
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: ann });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role))
      return res.status(403).json({ success: false });
    const { id } = req.params;
    const { message, link, active, startDate, endDate } = req.body;
    if (active) await Announcement.updateMany({}, { active: false });
    const ann = await Announcement.findByIdAndUpdate(
      id,
      { message, link, active: !!active, startDate, endDate },
      { new: true }
    );
    res.json({ success: true, data: ann });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role))
      return res.status(403).json({ success: false });
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

exports.listAnnouncements = async (req, res) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

exports.getCurrentAnnouncement = async (req, res) => {
  try {
    const now = new Date();
    const ann = await Announcement.findOne({ active: true }).sort({
      updatedAt: -1,
    });
    if (!ann) return res.json({ success: true, data: null });
    // If restricted by date, check (endDate is end of day)
    if (ann.startDate && ann.startDate > now)
      return res.json({ success: true, data: null });
    if (ann.endDate) {
      const endOfDay = new Date(ann.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (endOfDay < now) return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: ann });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
