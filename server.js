// ================= REAL EARN - SIMPLE SERVER =================
// Version: 2.1 | No Anti-Fraud | For Render

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// ====================== CONFIG ======================
const JWT_SECRET = process.env.JWT_SECRET;
const USD_TO_AED = parseFloat(process.env.USD_TO_AED) || 3.67;
const USER_SHARE = parseFloat(process.env.USER_SHARE) || 0.70;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const POSTBACK_SECRET = process.env.POSTBACK_SECRET || "change-this-secret";
const MAX_TASK_AMOUNT_USD = parseFloat(process.env.MAX_TASK_AMOUNT_USD) || 50;

// ====================== SECURITY SETUP ======================
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT'] }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api/", apiLimiter);

// ====================== MONGODB ======================
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Error:", err.message);
        setTimeout(connectDB, 5000);
    }
}
connectDB();

// ====================== SCHEMAS ======================
const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    email: String,
    name: { type: String, default: 'User' },
    photoURL: String,
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    taskCompletedCount: { type: Number, default: 0 }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
    userId: String,
    type: { type: String, enum: ['earning', 'withdrawal'] },
    amount: Number,
    taskId: String,
    site: String,
    network: String,
    status: { type: String, default: 'success' },
    details: String,
    method: String,
    account: String,
    processedAt: Date
}, { timestamps: true });

const TaskCompletionSchema = new mongoose.Schema({
    userId: String,
    taskId: String,
    site: String,
    network: String,
    amountUSD: Number,
    amountAED: Number
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);
const TaskCompletion = mongoose.model("TaskCompletion", TaskCompletionSchema);

// ====================== MIDDLEWARES ======================
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: "Token required" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, error: "Invalid token" });
        req.userId = decoded.userId;
        next();
    });
};

// ====================== ROUTES ======================
app.get("/health", (req, res) => res.json({ status: "OK" }));

// Register / Login (No Device Check)
app.post("/api/user", async (req, res) => {
    try {
        const { userId, email, name, photoURL } = req.body;

        if (!userId) return res.status(400).json({ success: false, error: "userId required" });

        let user = await User.findOne({ userId });

        if (!user) {
            user = await User.create({ userId, email, name, photoURL });
        } else {
            if (email) user.email = email;
            if (name) user.name = name;
            await user.save();
        }

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                balance: user.balance,
                totalEarned: user.totalEarned,
                totalWithdrawn: user.totalWithdrawn,
                taskCompletedCount: user.taskCompletedCount
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Postback (Simplified)
app.post("/api/postback/:network", async (req, res) => {
    try {
        const network = req.params.network;
        const userId = req.body.userId || req.body.user_id || req.body.sub_id;
        const taskId = req.body.taskId || req.body.offer_id || req.body.transaction_id;
        const amountUSD = parseFloat(req.body.amount || req.body.payout || req.body.reward || 0);

        if (!userId || !taskId || amountUSD <= 0) {
            return res.status(400).json({ success: false, error: "Missing fields" });
        }

        const amountAED = parseFloat(((amountUSD * USD_TO_AED) * USER_SHARE).toFixed(2));

        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { $inc: { balance: amountAED, totalEarned: amountAED, taskCompletedCount: 1 } },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ success: false, error: "User not found" });

        await TaskCompletion.create({ userId, taskId, site: network, network, amountUSD, amountAED });
        await Transaction.create({ userId, type: 'earning', amount: amountAED, taskId, site: network, network, status: 'success' });

        console.log(`✅ Earning Added: \( {userId} + \){amountAED} AED`);
        res.json({ success: true, message: "Earning credited" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Manual Earning (for testing)
app.post("/api/add-earning", authenticateToken, async (req, res) => {
    try {
        const { taskId, amount, site } = req.body;
        const amountAED = parseFloat(((amount * USD_TO_AED) * USER_SHARE).toFixed(2));

        const updatedUser = await User.findOneAndUpdate(
            { userId: req.userId },
            { $inc: { balance: amountAED, totalEarned: amountAED, taskCompletedCount: 1 } },
            { new: true }
        );

        await Transaction.create({ userId: req.userId, type: 'earning', amount: amountAED, taskId, site });

        res.json({ success: true, newBalance: updatedUser.balance });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// ====================== SERVER ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
