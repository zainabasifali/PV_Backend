const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const { protect } = require("../middleware/authMiddleware");

// @route   GET /api/batches
// @desc    Get all batches
router.get("/", async (req, res) => {
    try {
        const batches = await Batch.find().sort({ createdAt: -1 });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   GET /api/batches/:id
// @desc    Get batch by ID
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

// @route   POST /api/batches
// @desc    Create a new batch (protected)
router.post("/", protect, async (req, res) => {
    try {
        const { productId, batchNumber, manufactureDate, expiryDate } = req.body;
        const batch = await Batch.create({
            productId,
            batchNumber,
            manufactureDate,
            expiryDate,
        });
        res.status(201).json(batch);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/batches/:id
// @desc    Update a batch (protected)
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

// @route   DELETE /api/batches/:id
// @desc    Delete a batch (protected)
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
