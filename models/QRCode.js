const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  coaId: { type: mongoose.Schema.Types.ObjectId, ref: "COA", required: true },
  qrCode: { type: String, required: true, unique: true },
  status: { type: String, default: "unused" },
  scanCount: { type: Number, default: 0 },
  activated: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("QRCode", qrCodeSchema);