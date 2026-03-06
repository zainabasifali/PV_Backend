const mongoose = require("mongoose");

const coaSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  fileUrl: { type: String, required: true }, 
  labName: { type: String, required: true },
  purity: { type: String, required: true }, 
  version: { type: Number, default: 1 },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("COA", coaSchema);