const express = require("express");
const Transaction = require("../models/Transaction");
const Friend = require("../models/Friend");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// POST /api/transactions — Add a transaction
router.post("/", async (req, res) => {
  try {
    const { friendId, amount, type, date, note } = req.body;

    // Validate friend belongs to user
    const friend = await Friend.findOne({ _id: friendId, userId: req.user.id });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!["given", "received"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'given' or 'received'" });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      friendId,
      amount,
      type,
      date: date || Date.now(),
      note: note || "",
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/transactions/:friendId — Get transactions for a friend
router.get("/:friendId", async (req, res) => {
  try {
    // Validate friend belongs to user
    const friend = await Friend.findOne({ _id: req.params.friendId, userId: req.user.id });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const transactions = await Transaction.find({
      userId: req.user.id,
      friendId: req.params.friendId,
    }).sort({ date: -1 });

    // Calculate summary
    let totalGiven = 0;
    let totalReceived = 0;

    transactions.forEach((t) => {
      if (t.type === "given") totalGiven += t.amount;
      else totalReceived += t.amount;
    });

    res.json({
      friend: {
        _id: friend._id,
        name: friend.name,
      },
      transactions,
      summary: {
        totalGiven,
        totalReceived,
        netBalance: totalGiven - totalReceived,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PATCH /api/transactions/:id/settle — Mark transaction as settled
router.patch("/:id/settle", async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    transaction.settled = !transaction.settled;
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/transactions/:id — Delete a transaction
router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await Transaction.deleteOne({ _id: transaction._id });
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
