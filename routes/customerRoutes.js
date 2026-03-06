const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { protect } = require("../middleware/authMiddleware");


router.get("/", protect, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", protect, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, email, phoneNumber, city } = req.body;

        if (!name || !email || !phoneNumber || !city) {
            return res.status(400).json({ message: "All fields are required: name, email, phoneNumber, city" });
        }

        const existing = await Customer.findOne({ email });
        if (existing) return res.status(400).json({ message: "Customer with this email already exists" });

        const customer = await Customer.create({ name, email, phoneNumber, city });
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/:id", protect, async (req, res) => {
    try {
        const { name, email, phoneNumber, city } = req.body;
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        if (name) customer.name = name;
        if (email) customer.email = email;
        if (phoneNumber) customer.phoneNumber = phoneNumber;
        if (city) customer.city = city;

        const updated = await customer.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
