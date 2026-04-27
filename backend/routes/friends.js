const express = require("express");
const Friend = require("../models/Friend");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// POST /api/friends — Add a new friend
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Friend name is required" });
    }

    // Check if friend with same name already exists for this user
    const existing = await Friend.findOne({ userId: req.user.id, name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Friend with this name already exists" });
    }

    const friend = await Friend.create({
      userId: req.user.id,
      name: name.trim(),
    });

    res.status(201).json(friend);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/friends — Get all friends with net balance
router.get("/", async (req, res) => {
  try {
    const friends = await Friend.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // Calculate balances for each friend
    const friendsWithBalance = await Promise.all(
      friends.map(async (friend) => {
        const transactions = await Transaction.find({
          userId: req.user.id,
          friendId: friend._id,
        });

        let totalGiven = 0;
        let totalReceived = 0;

        transactions.forEach((t) => {
          if (t.type === "given") totalGiven += t.amount;
          else totalReceived += t.amount;
        });

        const netBalance = totalGiven - totalReceived;

        // Find most recent unsettled transaction for Memory Mode
        const recentTransaction = await Transaction.findOne({
          userId: req.user.id,
          friendId: friend._id,
          settled: false,
        }).sort({ date: -1 });

        return {
          _id: friend._id,
          name: friend.name,
          totalGiven,
          totalReceived,
          netBalance,
          recentTransaction,
          createdAt: friend.createdAt,
        };
      })
    );

    res.json(friendsWithBalance);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/friends/:id — Delete a friend and their transactions
router.delete("/:id", async (req, res) => {
  try {
    const friend = await Friend.findOne({ _id: req.params.id, userId: req.user.id });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Delete all transactions with this friend
    await Transaction.deleteMany({ userId: req.user.id, friendId: friend._id });

    // Delete the friend
    await Friend.deleteOne({ _id: friend._id });

    res.json({ message: "Friend and their transactions deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
