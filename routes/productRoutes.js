const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
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
        const { name, slug, description, storage, packaging } = req.body;

        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        }

        const product = await Product.create({
            name,
            slug,
            description,
            storage,
            packaging,
            images,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/:id", protect, upload.array("images", 5), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let updateData = { ...req.body };

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            // If the user wants to append images or replace them? 
            // Usually, replacement is safer unless specified.
            // Let's assume replacement for now or append if images field is missing.
            updateData.images = newImages;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
