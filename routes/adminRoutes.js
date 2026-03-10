const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { protect } = require("../middleware/authMiddleware");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log(req.body);
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            token: generateToken(admin._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            token: generateToken(admin._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/stats", protect, async (req, res) => {
    try {
        const Product = require("../models/Product");
        const Batch = require("../models/Batch");
        const QRCodeModel = require("../models/QRCode");
        const Category = require("../models/Category");
        const COA = require("../models/COA");

        const totalProducts = await Product.countDocuments();
        const totalBatches = await Batch.countDocuments();
        const totalScans = await QRCodeModel.aggregate([
            { $group: { _id: null, total: { $sum: "$scanCount" } } }
        ]);

        const totalScansCount = totalScans.length > 0 ? totalScans[0].total : 0;

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringSoon = await Batch.countDocuments({
            expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
        });

        const categories = await Category.find();
        const categoryDistribution = await Promise.all(categories.map(async (cat) => {
            const count = await Product.countDocuments({ categoryId: cat._id });
            return { name: cat.name, count };
        }));

        const recentScans = await QRCodeModel.find({ scanCount: { $gt: 0 } })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate("productId batchId");

        const recentBatches = await Batch.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("productId");

        const recentCOAs = await COA.find()
            .sort({ uploadedAt: -1 })
            .limit(5)
            .populate("batchId");

        const recentActivity = [
            ...recentScans.map(s => ({ type: "scan", message: `QR Code for ${s.productId?.name || 'Product'} scanned`, time: s.updatedAt })),
            ...recentBatches.map(b => ({ type: "batch", message: `New batch #${b.batchNumber} created for ${b.productId?.name || 'Product'}`, time: b.createdAt })),
            ...recentCOAs.map(c => ({ type: "coa", message: `COA uploaded for Batch #${c.batchId?.batchNumber || 'Batch'}`, time: c.uploadedAt }))
        ].sort((a, b) => b.time - a.time).slice(0, 10);

        // Scan Activity (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const scanActivityData = await QRCodeModel.aggregate([
            {
                $match: {
                    updatedAt: { $gte: thirtyDaysAgo },
                    scanCount: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    total: { $sum: "$scanCount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const generateActivityArray = (days) => {
            const activity = [];
            const today = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const match = scanActivityData.find(d => d._id === dateStr);
                activity.push(match ? match.total : 0);
            }
            return activity;
        };

        const scanActivity = {
            week: generateActivityArray(7),
            month: generateActivityArray(30)
        };

        res.json({
            totalProducts,
            totalBatches,
            totalScans: totalScansCount,
            expiringSoon,
            categoryDistribution,
            recentActivity,
            scanActivity
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
