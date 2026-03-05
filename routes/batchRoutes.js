const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Batch = require("../models/Batch");
const COA = require("../models/COA");
const QRCodeModel = require("../models/QRCode");
const { protect } = require("../middleware/authMiddleware");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/", async (req, res) => {
    try {
        const batches = await Batch.find().sort({ createdAt: -1 });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid batch ID format" });
        }
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/", protect, async (req, res) => {
    try {
        const { productId, batchNumber, manufactureDate, expiryDate, quantity } = req.body;

        if (!productId || !isValidObjectId(productId)) {
            return res.status(400).json({ message: "Valid Product ID is required" });
        }

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: "Quantity is required and must be greater than 0" });
        }

        const batch = await Batch.create({
            productId,
            batchNumber,
            manufactureDate,
            expiryDate,
            quantity,
        });

        res.status(201).json(batch);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/:id", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid batch ID format" });
        }
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

router.delete("/:id", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid batch ID format" });
        }

        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        // Cascade delete: COAs and QRCodes
        await QRCodeModel.deleteMany({ batchId: req.params.id });
        await COA.deleteMany({ batchId: req.params.id });

        await Batch.findByIdAndDelete(req.params.id);
        res.json({ message: "Batch and related data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;