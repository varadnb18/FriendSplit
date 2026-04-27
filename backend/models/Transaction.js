const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Friend",
    required: true,
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be greater than 0"],
  },
  type: {
    type: String,
    enum: ["given", "received"],
    required: [true, "Transaction type is required"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    trim: true,
    default: "",
  },
  settled: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
