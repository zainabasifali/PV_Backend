const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, 
  description: { type: String },
  storage: { type: String },
  packaging: { type: String },
  images: [String], 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);