const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  qrCode: { type: String, required: true, unique: true }, 
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  status: { type: String, enum: ["unused", "verified", "invalid", "deactivated"], default: "unused" },
  scanCount: { type: Number, default: 0 },
  activated: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QRCode", qrCodeSchema);