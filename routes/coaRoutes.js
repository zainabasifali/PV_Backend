const express = require("express");
const router = express.Router();
const COA = require("../models/COA");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", async (req, res) => {
    try {
        const coas = await COA.find().populate("batchId").sort({ uploadedAt: -1 });
        res.json(coas);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const coa = await COA.findById(req.params.id).populate("batchId");
        if (!coa) {
            return res.status(404).json({ message: "COA not found" });
        }
        res.json(coa);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/", protect, upload.single("file"), async (req, res) => {
    try {
        const { batchId, labName, purity } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Please upload a COA file" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        const coa = await COA.create({
            batchId,
            fileUrl,
            labName,
            purity
        });

        res.status(201).json(coa);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/:id", protect, upload.single("file"), async (req, res) => {
    try {
        const coa = await COA.findById(req.params.id);
        if (!coa) {
            return res.status(404).json({ message: "COA not found" });
        }

        let updateData = { ...req.body };

        if (req.file) {
            updateData.fileUrl = `/uploads/${req.file.filename}`;
            updateData.version = (coa.version || 1) + 1;
        }

        const updatedCOA = await COA.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedCOA);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const coa = await COA.findById(req.params.id);
        if (!coa) {
            return res.status(404).json({ message: "COA not found" });
        }

        await COA.findByIdAndDelete(req.params.id);
        res.json({ message: "COA deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
