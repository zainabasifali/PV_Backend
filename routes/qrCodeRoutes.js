const express = require("express");
const router = express.Router();
const QRCodeModel = require("../models/QRCode");
const Batch = require("../models/Batch");
const COA = require("../models/COA");
const { protect } = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { Parser } = require("json2csv");
const { getSignedUrl } = require("../helpers/cloudinaryHelper"); // <-- added

router.get("/", protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { batchId, productId } = req.query;
        let query = {};
        if (batchId) query.batchId = batchId;
        if (productId) query.productId = productId;

        const totalCount = await QRCodeModel.countDocuments(query);
        const qrCodes = await QRCodeModel.find(query)
            .populate("batchId productId coaId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const qrCodesWithUrls = qrCodes.map(q => ({
            ...q._doc,
            signedCoaFile: q.coaId ? getSignedUrl(q.coaId.fileUrl) : null
        }));

        res.json({
            qrCodes: qrCodesWithUrls,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", protect, async (req, res) => {
    try {
        const qrCode = await QRCodeModel.findById(req.params.id)
            .populate("batchId productId coaId");
        if (!qrCode) return res.status(404).json({ message: "QR code not found" });

        res.json({
            ...qrCode._doc,
            signedCoaFile: qrCode.coaId ? getSignedUrl(qrCode.coaId.fileUrl) : null
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/batch/:batchId", protect, async (req, res) => {
    try {
        const { batchId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalCount = await QRCodeModel.countDocuments({ batchId });
        const qrCodes = await QRCodeModel.find({ batchId })
            .populate("batchId productId coaId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({
            qrCodes,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
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
        if (existing.length > 0) return res.status(400).json({ message: "QR codes already generated for this batch" });

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

router.post("/scan", async (req, res) => {
    try {
        const { qrCode } = req.body;
        if (!qrCode) return res.status(400).json({ message: "QR code is required" });

        const qrCodeDoc = await QRCodeModel.findOne({ qrCode })
            .populate("coaId")
            .populate("productId")
            .populate("batchId");

        if (!qrCodeDoc) return res.status(404).json({ message: "Invalid QR code", status: "Invalid" });

        const previousScanCount = qrCodeDoc.scanCount;

        qrCodeDoc.scanCount += 1;
        qrCodeDoc.status = "used";
        await qrCodeDoc.save();

        const verificationStatus = previousScanCount === 0 ? "Verified" : "Already verified";

        const signedCoaFile = qrCodeDoc.coaId ? getSignedUrl(qrCodeDoc.coaId.fileUrl) : null;

        res.json({
            message: "QR code scanned successfully",
            status: verificationStatus,
            coaFile: signedCoaFile, 
            product: qrCodeDoc.productId,
            scanCount: qrCodeDoc.scanCount,
            purity: qrCodeDoc.coaId ? qrCodeDoc.coaId.purity : null,
            labName: qrCodeDoc.coaId ? qrCodeDoc.coaId.labName : null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/export/:batchId", protect, async (req, res) => {
    try {
        const { batchId } = req.params;

        const qrCodes = await QRCodeModel.find({ batchId });

        if (qrCodes.length === 0) {
            return res.status(404).json({ message: "No QR codes found for this batch" });
        }

        const csvData = qrCodes.map(q => ({ qrCode: q.qrCode }));

        const parser = new Parser({ fields: ["qrCode"] });
        const csv = parser.parse(csvData);

        res.header("Content-Type", "text/csv");
        res.header(
            "Content-Disposition",
            `attachment; filename="batch_${batchId}_qrcodes.csv"`
        );
        res.send(csv);

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



module.exports = router;