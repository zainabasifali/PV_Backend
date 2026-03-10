const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const COA = require("../models/COA");
const QRCodeModel = require("../models/QRCode");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid COA ID format" });
        }
        const coa = await COA.findById(req.params.id).populate("batchId");
        if (!coa) {
            return res.status(404).json({ message: "COA not found" });
        }
        res.json(coa);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/", protect, (req, res) => {
    upload.single("file")(req, res, async (err) => {
        try {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ message: "File is too large. Max size is 100MB" });
                }
                return res.status(400).json({ message: err.message });
            }

            const { batchId, labName, purity } = req.body;

            if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
                return res.status(400).json({ message: "Valid Batch ID is required" });
            }
            if (!req.file) {
                return res.status(400).json({ message: "Please upload a COA file" });
            }
            if (!labName || !purity) {
                return res.status(400).json({ message: "Lab name and purity are required" });
            }

            const fileUrl = req.file.path;

            const coa = await COA.create({
                batchId,
                fileUrl,
                labName,
                purity,
            });

            res.status(201).json(coa);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });
});

router.put("/:id", protect, (req, res) => {
    upload.single("file")(req, res, async (err) => {
        try {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ message: "File is too large. Max size is 100MB" });
                }
                return res.status(400).json({ message: err.message });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: "Invalid COA ID format" });
            }

            const coa = await COA.findById(req.params.id);
            if (!coa) return res.status(404).json({ message: "COA not found" });

            let updateData = { ...req.body };

            if (req.file) {
                updateData.fileUrl = req.file.path;
                updateData.version = (coa.version || 1) + 1;
            }

            const updatedCOA = await COA.findByIdAndUpdate(req.params.id, updateData, {
                new: true,
                runValidators: true,
            });

            res.json(updatedCOA);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });
});

router.delete("/:id", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid COA ID format" });
        }

        const coa = await COA.findById(req.params.id);
        if (!coa) {
            return res.status(404).json({ message: "COA not found" });
        }

        // Cascade delete: QRCodes linking to this COA
        await QRCodeModel.deleteMany({ coaId: req.params.id });

        await COA.findByIdAndDelete(req.params.id);
        res.json({ message: "COA and related QR codes deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
