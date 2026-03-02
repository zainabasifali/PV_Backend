const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const { protect } = require("../middleware/authMiddleware");

// Get all batches
router.get("/", async (req, res) => {
    try {
        const batches = await Batch.find().sort({ createdAt: -1 });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get batch by ID
router.get("/:id", async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Create a batch
router.post("/", protect, async (req, res) => {
    try {
        const { productId, batchNumber, manufactureDate, expiryDate, quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: "Quantity is required and must be greater than 0" });
        }

        const batch = await Batch.create({
            productId,
            batchNumber,
            manufactureDate,
            expiryDate,
            quantity, // <-- important!
        });

        res.status(201).json(batch);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update batch
router.put("/:id", protect, async (req, res) => {
    try {
        const updatedBatch = await Batch.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedBatch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        res.json(updatedBatch);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete batch
router.delete("/:id", protect, async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        await Batch.findByIdAndDelete(req.params.id);
        res.json({ message: "Batch deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;