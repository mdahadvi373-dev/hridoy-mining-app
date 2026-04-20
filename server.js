// ================= REAL EARN - FULL PRODUCTION SERVER =================
// Version: 2.0 | Anti-Fraud | Device Tracking | Postback Verified | Admin Panel

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// ====================== CONFIG ======================
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const USD_TO_AED = parseFloat(process.env.USD_TO_AED) || 3.67;
const USER_SHARE = parseFloat(process.env.USER_SHARE) || 0.70;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const POSTBACK_SECRET = process.env.POSTBACK_SECRET || "change-this-secret";

// Max allowed earning per task (fraud protection)
const MAX_TASK_AMOUNT_USD = parseFloat(process.env.MAX_TASK_AMOUNT_USD) || 50;

// ====================== KEEP ALIVE ======================
let serverStartTime = Date.now();
function keepServerAlive() {
    const hostname = process.env.RENDER_EXTERNAL_HOSTNAME;
    if (!hostname) return;
    fetch(`https://${hostname}/health`, { method: 'HEAD' })
        .catch(() => {});
}
setInterval(keepServerAlive, 4 * 60 * 1000); // every 4 minutes

// ====================== SECURITY SETUP ======================
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT'] }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Rate limiters
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, error: "Too many requests" } });
const loginLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { success: false, error: "Too many login attempts" } });
const withdrawLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, error: "Too many withdrawal requests" } });

app.use("/api/", apiLimiter);

// ====================== MONGODB ======================
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
        setTimeout(connectDB, 5000); // retry after 5s
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn("⚠️ MongoDB disconnected. Reconnecting...");
    isConnected = false;
    setTimeout(connectDB, 3000);
});

mongoose.connection.on('error', (err) => {
    console.error("❌ MongoDB Error:", err.message);
    isConnected = false;
});

connectDB();

// ====================== SCHEMAS ======================

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: 'User' },
    photoURL: { type: String, default: '' },
    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    deviceId: { type: String, required: true, index: true },
    deviceFingerprint: { type: String, default: '' },
    lastIP: { type: String, default: '' },
    suspiciousActivityCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: '' },
    loginCount: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: Date.now },
    taskCompletedCount: { type: Number, default: 0 }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    type: { type: String, enum: ['earning', 'withdrawal'] },
    amount: Number,
    taskId: String,
    site: String,
    network: String,
    status: { type: String, enum: ['success', 'pending', 'approved', 'rejected'], default: 'pending' },
    details: String,
    ip: String,
    method: String,   // for withdrawal: bkash, nagad, etc.
    account: String,  // for withdrawal: phone/account number
    adminNote: { type: String, default: '' },
    processedAt: Date
}, { timestamps: true });

const TaskCompletionSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    taskId: { type: String, index: true },
    site: String,
    network: String,
    amountUSD: Number,
    amountAED: Number,
    ip: String,
    completedAt: { type: Date, default: Date.now }
});
TaskCompletionSchema.index({ userId: 1, taskId: 1 }, { unique: true });

const PostbackLogSchema = new mongoose.Schema({
    network: String,
    rawBody: mongoose.Schema.Types.Mixed,
    ip: String,
    verified: Boolean,
    processed: Boolean,
    error: String,
    receivedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);
const TaskCompletion = mongoose.model("TaskCompletion", TaskCompletionSchema);
const PostbackLog = mongoose.model("PostbackLog", PostbackLogSchema);

// ====================== HELPERS ======================

function generateDeviceFingerprint(req) {
    const data = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        req.ip || ''
    ].join('|');
    return crypto.createHash('sha256').update(data).digest('hex');
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.connection?.remoteAddress
        || req.ip
        || 'unknown';
}

// Verify postback HMAC signature
function verifyPostbackSignature(body, signature, secret) {
    if (!signature) return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
        return false;
    }
}

// Check if device is already used by another user
async function checkDeviceFraud(deviceId, userId) {
    const existing = await User.findOne({ deviceId, userId: { $ne: userId } });
    if (existing) {
        return { fraud: true, msg: "এই device অন্য account এ registered। এক phone এ এক account চলবে।" };
    }
    return { fraud: false };
}

// ====================== MIDDLEWARES ======================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ success: false, error: "Token required" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, error: "Invalid or expired token" });
        req.userId = decoded.userId;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!ADMIN_USER_ID || req.userId !== ADMIN_USER_ID) {
        return res.status(403).json({ success: false, error: "Admin access only" });
    }
    next();
};

const checkNotBlocked = async (req, res, next) => {
    try {
        const user = await User.findOne({ userId: req.userId }).select('isBlocked blockReason');
        if (!user) return res.status(404).json({ success: false, error: "User not found" });
        if (user.isBlocked) return res.status(403).json({ success: false, error: `Account blocked: ${user.blockReason || 'Policy violation'}` });
        next();
    } catch {
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// ====================== ROUTES ======================

// Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        uptime: Math.round((Date.now() - serverStartTime) / 1000),
        db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// App Settings
app.get("/api/networks", (req, res) => {
    res.json({ success: true, settings: { usd_to_aed: USD_TO_AED, user_share: USER_SHARE } });
});

// ====================== USER AUTH ======================

// Register / Login
app.post("/api/user", loginLimiter, async (req, res) => {
    try {
        const { userId, email, name, photoURL, deviceId } = req.body;
        const ip = getClientIP(req);
        const fingerprint = generateDeviceFingerprint(req);

        if (!userId || !deviceId) {
            return res.status(400).json({ success: false, error: "userId এবং deviceId required" });
        }

        // Anti-fraud: device check
        const fraudCheck = await checkDeviceFraud(deviceId, userId);
        if (fraudCheck.fraud) {
            // Log suspicious activity
            console.warn(`⚠️ Device Fraud Attempt: deviceId=${deviceId} userId=${userId} ip=${ip}`);
            return res.status(403).json({ success: false, error: fraudCheck.msg });
        }

        let user = await User.findOne({ userId });

        if (!user) {
            user = await User.create({
                userId, email, name, photoURL,
                deviceId, deviceFingerprint: fingerprint,
                lastIP: ip, loginCount: 1
            });
        } else {
            if (user.isBlocked) {
                return res.status(403).json({ success: false, error: `Account blocked: ${user.blockReason || 'Policy violation'}` });
            }

            // Update device info
            user.deviceId = deviceId;
            user.deviceFingerprint = fingerprint;
            user.lastIP = ip;
            user.loginCount += 1;
            user.lastLoginAt = new Date();
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
                photoURL: user.photoURL,
                balance: parseFloat(user.balance.toFixed(2)),
                totalEarned: parseFloat(user.totalEarned.toFixed(2)),
                totalWithdrawn: parseFloat(user.totalWithdrawn.toFixed(2)),
                taskCompletedCount: user.taskCompletedCount
            }
        });
    } catch (err) {
        console.error("User login error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Get User Info
app.get("/api/user/:userId", authenticateToken, checkNotBlocked, async (req, res) => {
    if (req.params.userId !== req.userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    try {
        const user = await User.findOne({ userId: req.userId })
            .select('balance totalEarned totalWithdrawn taskCompletedCount name email photoURL');
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        res.json({
            success: true,
            balance: parseFloat(user.balance.toFixed(2)),
            totalEarned: parseFloat(user.totalEarned.toFixed(2)),
            totalWithdrawn: parseFloat(user.totalWithdrawn.toFixed(2)),
            taskCompletedCount: user.taskCompletedCount,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// User Transaction History
app.get("/api/user/:userId/transactions", authenticateToken, checkNotBlocked, async (req, res) => {
    if (req.params.userId !== req.userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const txs = await Transaction.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-ip -__v');

        const total = await Transaction.countDocuments({ userId: req.userId });

        res.json({ success: true, transactions: txs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// ====================== POSTBACK (Offerwall/Survey/Game) ======================
// Network ta postback pathabe jodi user task complete kore
// Signature verify kore tarpor balance add hobe

app.post("/api/postback/:network", async (req, res) => {
    const network = req.params.network;
    const ip = getClientIP(req);
    const signature = req.headers['x-postback-signature'] || req.body.signature || req.query.signature;

    let logEntry;
    try {
        // Log the raw postback first
        logEntry = await PostbackLog.create({
            network,
            rawBody: req.body,
            ip,
            verified: false,
            processed: false
        });

        // ---- Signature Verification ----
        const isVerified = verifyPostbackSignature(req.body, signature, POSTBACK_SECRET);
        // NOTE: In production, each network has its own secret/verification method.
        // For testing you can set SKIP_POSTBACK_VERIFY=true in .env
        if (!isVerified && process.env.SKIP_POSTBACK_VERIFY !== 'true') {
            logEntry.error = "Signature verification failed";
            await logEntry.save();
            console.warn(`⚠️ Postback signature failed | network=${network} ip=${ip}`);
            return res.status(403).json({ success: false, error: "Invalid signature" });
        }

        logEntry.verified = true;

        // ---- Extract fields (networks send different field names) ----
        const userId = req.body.userId || req.body.user_id || req.body.sub_id || req.body.aff_sub;
        const taskId = req.body.taskId || req.body.offer_id || req.body.transaction_id || req.body.tid;
        const amountUSD = parseFloat(req.body.amount || req.body.payout || req.body.reward || 0);
        const site = req.body.site || req.body.offer_name || network;

        if (!userId || !taskId || !amountUSD || amountUSD <= 0) {
            logEntry.error = `Missing fields: userId=${userId} taskId=${taskId} amount=${amountUSD}`;
            await logEntry.save();
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // Amount cap (fraud: no single task should pay too much)
        if (amountUSD > MAX_TASK_AMOUNT_USD) {
            logEntry.error = `Amount too high: ${amountUSD} USD`;
            await logEntry.save();
            console.warn(`⚠️ Suspicious amount: userId=${userId} amount=${amountUSD}`);
            return res.status(400).json({ success: false, error: "Amount exceeds maximum allowed" });
        }

        // Find user
        const user = await User.findOne({ userId });
        if (!user) {
            logEntry.error = "User not found";
            await logEntry.save();
            return res.status(404).json({ success: false, error: "User not found" });
        }

        if (user.isBlocked) {
            logEntry.error = "User is blocked";
            await logEntry.save();
            return res.status(403).json({ success: false, error: "User is blocked" });
        }

        // Duplicate task check
        const alreadyDone = await TaskCompletion.findOne({ userId, taskId });
        if (alreadyDone) {
            logEntry.error = "Duplicate task";
            logEntry.processed = false;
            await logEntry.save();
            return res.status(409).json({ success: false, error: "Task already credited" });
        }

        // Calculate earning
        const amountAED = parseFloat(((amountUSD * USD_TO_AED) * USER_SHARE).toFixed(4));

        // Atomic balance update
        const updatedUser = await User.findOneAndUpdate(
            { userId, isBlocked: false },
            {
                $inc: {
                    balance: amountAED,
                    totalEarned: amountAED,
                    taskCompletedCount: 1
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            logEntry.error = "Balance update failed";
            await logEntry.save();
            return res.status(500).json({ success: false, error: "Balance update failed" });
        }

        // Record task completion
        await TaskCompletion.create({ userId, taskId, site, network, amountUSD, amountAED, ip });

        // Record transaction
        await Transaction.create({
            userId,
            type: 'earning',
            amount: amountAED,
            taskId,
            site,
            network,
            status: 'success',
            details: `${network} - ${site}`,
            ip
        });

        logEntry.processed = true;
        await logEntry.save();

        console.log(`✅ Postback OK | userId=${userId} taskId=${taskId} +${amountAED} AED (${amountUSD} USD) [${network}]`);
        res.json({ success: true, message: "Earning credited" });

    } catch (err) {
        console.error("Postback error:", err);
        if (logEntry) {
            logEntry.error = err.message;
            await logEntry.save().catch(() => {});
        }
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Manual earning add (from frontend, for testing only — disable in production)
app.post("/api/add-earning", authenticateToken, checkNotBlocked, async (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MANUAL_EARN !== 'true') {
        return res.status(403).json({ success: false, error: "Manual earning disabled in production" });
    }

    try {
        const { taskId, amount, site, network = "manual" } = req.body;
        const ip = getClientIP(req);

        if (!taskId || !amount || isNaN(amount) || amount <= 0 || amount > MAX_TASK_AMOUNT_USD) {
            return res.status(400).json({ success: false, error: "Invalid task or amount" });
        }

        const alreadyDone = await TaskCompletion.findOne({ userId: req.userId, taskId });
        if (alreadyDone) return res.status(409).json({ success: false, error: "Task already completed" });

        const amountAED = parseFloat(((amount * USD_TO_AED) * USER_SHARE).toFixed(4));

        const updatedUser = await User.findOneAndUpdate(
            { userId: req.userId, isBlocked: false },
            { $inc: { balance: amountAED, totalEarned: amountAED, taskCompletedCount: 1 } },
            { new: true }
        );

        if (!updatedUser) return res.status(500).json({ success: false, error: "Update failed" });

        await TaskCompletion.create({ userId: req.userId, taskId, site, network, amountUSD: amount, amountAED, ip });
        await Transaction.create({
            userId: req.userId, type: 'earning', amount: amountAED,
            taskId, site, network, status: 'success',
            details: `Manual - ${site}`, ip
        });

        res.json({
            success: true,
            newBalance: parseFloat(updatedUser.balance.toFixed(2)),
            earned: amountAED
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// ====================== WITHDRAWAL ======================

app.post("/api/withdraw", authenticateToken, withdrawLimiter, checkNotBlocked, async (req, res) => {
    try {
        const { amount, method, account } = req.body;
        const ip = getClientIP(req);

        // Validation
        if (!amount || isNaN(amount) || amount < 50) {
            return res.status(400).json({ success: false, error: "Minimum withdrawal 50 AED" });
        }
        if (!method || typeof method !== 'string' || method.trim().length < 2) {
            return res.status(400).json({ success: false, error: "Withdrawal method required (bkash/nagad/bank)" });
        }
        if (!account || typeof account !== 'string' || account.trim().length < 5) {
            return res.status(400).json({ success: false, error: "Valid account number required" });
        }

        const parsedAmount = parseFloat(parseFloat(amount).toFixed(2));

        // Atomic check-and-deduct to prevent race condition
        const user = await User.findOneAndUpdate(
            {
                userId: req.userId,
                isBlocked: false,
                balance: { $gte: parsedAmount }  // only update if balance is enough
            },
            { $inc: { balance: -parsedAmount } },
            { new: true }
        );

        if (!user) {
            // Either blocked or insufficient balance
            const check = await User.findOne({ userId: req.userId }).select('balance isBlocked');
            if (!check) return res.status(404).json({ success: false, error: "User not found" });
            if (check.isBlocked) return res.status(403).json({ success: false, error: "Account blocked" });
            return res.status(400).json({ success: false, error: "Insufficient balance" });
        }

        await Transaction.create({
            userId: req.userId,
            type: 'withdrawal',
            amount: -parsedAmount,
            status: 'pending',
            method: method.trim(),
            account: account.trim(),
            details: `${method.trim()} → ${account.trim()}`,
            ip
        });

        console.log(`💸 Withdrawal Request: userId=${req.userId} amount=${parsedAmount} AED via ${method}`);

        res.json({
            success: true,
            message: "Withdrawal request submitted. Admin review pending.",
            newBalance: parseFloat(user.balance.toFixed(2))
        });
    } catch (err) {
        console.error("Withdraw error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// ====================== ADMIN ROUTES ======================

// Dashboard Stats
app.get("/api/admin/stats", authenticateToken, isAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            blockedUsers,
            totalTransactions,
            pendingWithdrawals,
            totalEarnings,
            totalWithdrawals
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isBlocked: true }),
            Transaction.countDocuments(),
            Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
            Transaction.aggregate([
                { $match: { type: 'earning', status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { type: 'withdrawal', status: { $in: ['approved', 'pending'] } } },
                { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                blockedUsers,
                totalTransactions,
                pendingWithdrawals,
                totalEarningsAED: parseFloat((totalEarnings[0]?.total || 0).toFixed(2)),
                totalWithdrawalsAED: parseFloat((totalWithdrawals[0]?.total || 0).toFixed(2))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Get All Users (paginated)
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 30, 100);
        const skip = (page - 1) * limit;
        const search = req.query.search;

        const query = search
            ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { userId: search }] }
            : {};

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-deviceFingerprint -__v'),
            User.countDocuments(query)
        ]);

        res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Get All Transactions (paginated, filterable)
app.get("/api/admin/transactions", authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.userId) filter.userId = req.query.userId;

        const [txs, total] = await Promise.all([
            Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Transaction.countDocuments(filter)
        ]);

        res.json({ success: true, transactions: txs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Pending Withdrawals only
app.get("/api/admin/withdrawals/pending", authenticateToken, isAdmin, async (req, res) => {
    try {
        const pending = await Transaction.find({ type: 'withdrawal', status: 'pending' })
            .sort({ createdAt: 1 }) // oldest first
            .lean();

        // Attach user info
        const userIds = [...new Set(pending.map(t => t.userId))];
        const users = await User.find({ userId: { $in: userIds } }).select('userId name email totalEarned').lean();
        const userMap = Object.fromEntries(users.map(u => [u.userId, u]));

        const result = pending.map(tx => ({
            ...tx,
            user: userMap[tx.userId] || null
        }));

        res.json({ success: true, withdrawals: result, count: result.length });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Approve / Reject Withdrawal
app.put("/api/admin/withdrawal/:txId", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { action, adminNote } = req.body; // action: 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, error: "Action must be 'approve' or 'reject'" });
        }

        const tx = await Transaction.findById(req.params.txId);
        if (!tx) return res.status(404).json({ success: false, error: "Transaction not found" });
        if (tx.type !== 'withdrawal') return res.status(400).json({ success: false, error: "Not a withdrawal" });
        if (tx.status !== 'pending') return res.status(400).json({ success: false, error: "Already processed" });

        if (action === 'approve') {
            tx.status = 'approved';
            tx.processedAt = new Date();
            tx.adminNote = adminNote || '';

            // Track total withdrawn on user
            await User.findOneAndUpdate(
                { userId: tx.userId },
                { $inc: { totalWithdrawn: Math.abs(tx.amount) } }
            );
        } else {
            // Reject: refund balance back
            tx.status = 'rejected';
            tx.processedAt = new Date();
            tx.adminNote = adminNote || '';

            await User.findOneAndUpdate(
                { userId: tx.userId },
                { $inc: { balance: Math.abs(tx.amount) } } // refund
            );
        }

        await tx.save();

        console.log(`👑 Admin ${action}d withdrawal: txId=${tx._id} userId=${tx.userId} amount=${Math.abs(tx.amount)} AED`);
        res.json({ success: true, message: `Withdrawal ${action}d`, transaction: tx });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Block / Unblock User
app.put("/api/admin/user/:userId/block", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { block, reason } = req.body;
        if (typeof block !== 'boolean') {
            return res.status(400).json({ success: false, error: "'block' must be true or false" });
        }

        const user = await User.findOneAndUpdate(
            { userId: req.params.userId },
            {
                isBlocked: block,
                blockReason: block ? (reason || 'Admin action') : ''
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        console.log(`👑 Admin ${block ? 'blocked' : 'unblocked'}: userId=${req.params.userId}`);
        res.json({ success: true, message: `User ${block ? 'blocked' : 'unblocked'}` });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Postback Logs
app.get("/api/admin/postback-logs", authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            PostbackLog.find().sort({ receivedAt: -1 }).skip(skip).limit(limit),
            PostbackLog.countDocuments()
        ]);

        res.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// ====================== FRONTEND STATIC ======================
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ====================== GLOBAL ERROR HANDLER ======================
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
});

// ====================== START SERVER ======================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`🚀 RealEarn Server running on port ${PORT}`);
    console.log(`🛡️  Anti-fraud: ON | Device Tracking: ON | Postback Verify: ${process.env.SKIP_POSTBACK_VERIFY === 'true' ? 'SKIPPED (dev)' : 'ON'}`);
    console.log(`💰 Rate: 1 USD = ${USD_TO_AED} AED | User Share: ${USER_SHARE * 100}%`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't exit — keep server alive
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    // Don't exit — keep server alive
});
