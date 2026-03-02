const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const batchRoutes = require("./routes/batchRoutes");
const coaRoutes = require("./routes/coaRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/coa", coaRoutes);

app.get("/", (req, res) => {
  res.send("Pharmacy API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});