const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  batchNumber: { type: String, required: true },
  manufactureDate: { type: Date },
  expiryDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Batch", batchSchema);