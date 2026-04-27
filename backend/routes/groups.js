const express = require("express");
const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// POST /api/groups — Create a group
router.post("/", async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Find members by their emails
    const members = [req.user.id]; // Creator is always a member

    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
          return res.status(400).json({ message: `No user found with email: ${email}` });
        }
        if (!members.includes(user._id.toString())) {
          members.push(user._id);
        }
      }
    }

    const group = await Group.create({
      name: name.trim(),
      members,
      createdBy: req.user.id,
    });

    // Populate members
    const populatedGroup = await Group.findById(group._id)
      .populate("members", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/groups — Get all groups for user
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Add expense summary for each group
    const groupsWithSummary = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ groupId: group._id });
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          ...group.toObject(),
          totalExpenses,
          expenseCount: expenses.length,
        };
      })
    );

    res.json(groupsWithSummary);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/groups/:id — Get group detail
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "name email")
      .populate("createdBy", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Get expenses
    const expenses = await Expense.find({ groupId: group._id })
      .populate("paidBy", "name email")
      .populate("splits.userId", "name email")
      .sort({ date: -1 });

    res.json({ group, expenses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
