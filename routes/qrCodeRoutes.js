const express = require("express");
const router = express.Router();
const QRCodeModel = require("../models/QRCode");
const Batch = require("../models/Batch");
const COA = require("../models/COA");
const { protect } = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode"); 
const { Transform } = require("json2csv"); 

router.get("/", protect, async (req, res) => {
    try {
        const qrCodes = await QRCodeModel.find()
            .populate("batchId productId coaId")
            .sort({ createdAt: -1 });
        res.json(qrCodes);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", protect, async (req, res) => {
    try {
        const qrCode = await QRCodeModel.findById(req.params.id)
            .populate("batchId productId coaId");
        if (!qrCode) {
            return res.status(404).json({ message: "QR code not found" });
        }
        res.json(qrCode);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/generate/:batchId", protect, async (req, res) => {
    try {
        const { batchId } = req.params;

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        const coa = await COA.findOne({ batchId: batch._id });
        if (!coa) return res.status(400).json({ message: "Upload COA before generating QR codes" });

        const existing = await QRCodeModel.find({ batchId: batch._id });
        if (existing.length > 0) {
            return res.status(400).json({ message: "QR codes already generated for this batch" });
        }

        const qrCodesArray = [];
        for (let i = 0; i < batch.quantity; i++) {
            const uniqueCode = uuidv4(); 

            qrCodesArray.push({
                batchId: batch._id,
                productId: batch.productId,
                coaId: coa._id,
                qrCode: uniqueCode,
                status: "unused",
                activated: true
            });
        }

        const createdQRCodes = await QRCodeModel.insertMany(qrCodesArray);

        res.status(201).json({
            message: `Successfully generated ${batch.quantity} QR codes`,
            qrCodes: createdQRCodes
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const qrCode = await QRCodeModel.findById(req.params.id);
        if (!qrCode) {
            return res.status(404).json({ message: "QR code not found" });
        }

        await QRCodeModel.findByIdAndDelete(req.params.id);
        res.json({ message: "QR code deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/export/:batchId", protect, async (req, res) => {
    try {
        const { batchId } = req.params;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="batch_${batchId}_qrcodes.csv"`
        );

        const cursor = QRCodeModel.find({ batchId }).cursor();

        const json2csv = new Transform({ fields: ["qrCode"] });

        cursor.pipe(json2csv).pipe(res);

        cursor.on("end", () => {
            console.log(`CSV streaming completed for batch ${batchId}`);
        });

        cursor.on("error", (err) => {
            console.error("Cursor error:", err);
            res.status(500).end("Server error during CSV export");
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;