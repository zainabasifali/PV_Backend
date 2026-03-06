const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  storage: { type: String },
  packaging: { type: String },
  images: {
    type: [String],
    required: true
  },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);