const express = require("express");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// POST /api/expenses — Add expense to group
router.post("/", async (req, res) => {
  try {
    const { groupId, amount, description, splitType, splits } = req.body;

    // Validate group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check membership
    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    let calculatedSplits = [];

    if (splitType === "equal") {
      // Equal split among all members
      const splitAmount = Math.round((amount / group.members.length) * 100) / 100;
      calculatedSplits = group.members.map((memberId) => ({
        userId: memberId,
        amount: splitAmount,
      }));
    } else if (splitType === "custom" && splits) {
      calculatedSplits = splits;
    } else {
      return res.status(400).json({ message: "Invalid split type or missing splits" });
    }

    const expense = await Expense.create({
      groupId,
      paidBy: req.user.id,
      amount,
      description,
      splitType,
      splits: calculatedSplits,
      date: req.body.date || Date.now(),
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("splits.userId", "name email");

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/expenses/simplified/:groupId — Get simplified debts
router.get("/simplified/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate("members", "name email");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check membership
    const isMember = group.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const expenses = await Expense.find({ groupId: req.params.groupId });

    // Calculate net balances for each member
    // Positive = they are owed money, Negative = they owe money
    const balances = {};
    group.members.forEach((m) => {
      balances[m._id.toString()] = { userId: m._id, name: m.name, email: m.email, amount: 0 };
    });

    expenses.forEach((expense) => {
      const payerId = expense.paidBy.toString();
      // The payer paid the full amount
      if (balances[payerId]) {
        balances[payerId].amount += expense.amount;
      }

      // Each person's split is what they owe
      expense.splits.forEach((split) => {
        const splitUserId = split.userId.toString();
        if (balances[splitUserId]) {
          balances[splitUserId].amount -= split.amount;
        }
      });
    });

    // Debt simplification algorithm
    const simplified = simplifyDebts(balances);

    res.json({
      group: {
        _id: group._id,
        name: group.name,
        members: group.members,
      },
      balances: Object.values(balances),
      simplifiedDebts: simplified,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Debt Simplification Algorithm
 * Minimizes the number of transactions needed to settle all debts
 *
 * Example:
 *   A owes B ₹100, B owes C ₹100
 *   Simplified: A pays C ₹100 directly
 */
function simplifyDebts(balances) {
  const people = Object.values(balances);
  const debts = [];

  // Separate into creditors and debtors
  const creditors = []; // positive balance = they are owed money
  const debtors = [];   // negative balance = they owe money

  people.forEach((p) => {
    if (p.amount > 0.01) {
      creditors.push({ ...p });
    } else if (p.amount < -0.01) {
      debtors.push({ ...p, amount: Math.abs(p.amount) });
    }
  });

  // Sort for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);

    if (settleAmount > 0.01) {
      debts.push({
        from: { userId: debtors[j].userId, name: debtors[j].name },
        to: { userId: creditors[i].userId, name: creditors[i].name },
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditors[i].amount -= settleAmount;
    debtors[j].amount -= settleAmount;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return debts;
}

module.exports = router;
