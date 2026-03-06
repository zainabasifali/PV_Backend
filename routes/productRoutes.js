const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Batch = require("../models/Batch");
const COA = require("../models/COA");
const QRCodeModel = require("../models/QRCode");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/", async (req, res) => {
    try {
        const { categoryId } = req.query;
        let query = {};
        if (categoryId) query.categoryId = categoryId;

        const products = await Product.find(query).populate("categoryId").sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID format" });
        }
        const product = await Product.findById(req.params.id).populate("categoryId");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/", protect, upload.array("images", 5), async (req, res) => {
    try {
        const { name, slug, description, storage, packaging, categoryId } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ message: "Name and slug are required" });
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        }

        if (images.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        const productExists = await Product.findOne({ slug });
        if (productExists) {
            return res.status(400).json({ message: "Product with this slug already exists" });
        }

        const product = await Product.create({
            name,
            slug,
            description,
            storage,
            packaging,
            images,
            categoryId
        });

        res.status(201).json(product);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Duplicate field value entered" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/:id", protect, upload.array("images", 5), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID format" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const { name, slug } = req.body;

        if (slug && slug !== product.slug) {
            const productExists = await Product.findOne({ slug });
            if (productExists) {
                return res.status(400).json({ message: "Product with this slug already exists" });
            }
        }

        let updateData = { ...req.body };

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            updateData.images = newImages;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate("categoryId");

        res.json(updatedProduct);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Duplicate field value entered" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID format" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const batches = await Batch.find({ productId: req.params.id });
        const batchIds = batches.map(b => b._id);

        await QRCodeModel.deleteMany({ productId: req.params.id });

        await COA.deleteMany({ batchId: { $in: batchIds } });

        await Batch.deleteMany({ productId: req.params.id });

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: "Product and all related data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;

