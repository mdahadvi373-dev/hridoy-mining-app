// ================= SERVER.JS - COMPLETE VERSION =================
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// ====================== KEEP ALIVE ======================
let serverStartTime = Date.now();

function keepServerAlive() {
    const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost';
    const port = process.env.PORT || 3000;
    const protocol = 'https';
    const url = `${protocol}://${hostname}/health`;

    fetch(url).catch(() => {
        console.log("Keep-alive ping sent");
    });
}

setInterval(keepServerAlive, 5 * 60 * 1000);

// ====================== SECURITY ======================
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    skip: (req) => req.path === '/health'
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10
});

app.use("/api/", apiLimiter);
app.use("/api/user", loginLimiter);

// ====================== STATIC FILES ======================
app.use(express.static(__dirname));

// ====================== MONGO DB ======================
const mongoConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: 'majority'
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Error:", err.message);
        setTimeout(mongoConnect, 5000);
    }
};

mongoConnect();

mongoose.connection.on('disconnected', () => {
    console.log("⚠️ MongoDB Disconnected");
    mongoConnect();
});

// ====================== SCHEMAS ======================
const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, index: true },
    name: String,
    photoURL: String,
    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    deviceId: { type: String, index: true, required: true },
    deviceFingerprint: { type: String, index: true },
    lastIP: String,
    lastUserAgent: String,
    lastLogin: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 0 },
    suspiciousActivityCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'users' });

UserSchema.index({ userId: 1, isBlocked: 1 });
UserSchema.index({ deviceId: 1, createdAt: -1 });
UserSchema.index({ lastLogin: -1 });

const User = mongoose.model("User", UserSchema);

const ActivitySchema = new mongoose.Schema({
    userId: { type: String, index: true },
    action: String,
    details: String,
    ip: String,
    timestamp: { type: Date, default: Date.now, index: true }
}, { collection: 'activities' });

ActivitySchema.index({ userId: 1, timestamp: -1 });
const Activity = mongoose.model("Activity", ActivitySchema);

// ====================== HELPER FUNCTIONS ======================
function generateDeviceFingerprint(req) {
    const crypto = require('crypto');
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || '';

    const fingerprint = crypto
        .createHash('sha256')
        .update(userAgent + ip + acceptLanguage + Date.now())
        .digest('hex');

    return fingerprint;
}

async function logActivity(userId, action, details, ip) {
    try {
        await Activity.create({
            userId,
            action,
            details,
            ip,
            timestamp: new Date()
        });
    } catch (err) {
        console.error("Activity log error:", err.message);
    }
}

async function checkDeviceFraud(deviceId, deviceFingerprint, userId = null) {
    if (!deviceId || !deviceFingerprint) {
        return { allowed: false, message: "Invalid device data" };
    }

    try {
        const recentUser = await User.findOne({
            deviceId: deviceId,
            userId: { $ne: userId }
        }).sort({ lastLogin: -1 }).lean();

        if (recentUser) {
            const timeDiff = Date.now() - new Date(recentUser.lastLogin).getTime();
            if (timeDiff < 24 * 60 * 60 * 1000) {
                return {
                    allowed: false,
                    message: "Device already registered"
                };
            }
        }

        const existingUser = await User.findOne({ userId }).lean();
        if (existingUser && existingUser.deviceFingerprint &&
            existingUser.deviceFingerprint !== deviceFingerprint) {

            const suspiciousCount = (existingUser.suspiciousActivityCount || 0) + 1;

            if (suspiciousCount > 5) {
                await User.updateOne({ userId }, { isBlocked: true });
                return {
                    allowed: false,
                    message: "Account blocked"
                };
            }

            await User.updateOne(
                { userId },
                { suspiciousActivityCount: suspiciousCount }
            );
        }

        return { allowed: true };
    } catch (err) {
        console.error("Fraud check error:", err.message);
        return { allowed: true };
    }
}

// ====================== ROUTES ======================

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        uptime: Math.round((Date.now() - serverStartTime) / 1000)
    });
});

// Serve React App (for frontend)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/games", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/surveys", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ====================== API ROUTES ======================

// Get Networks Config
app.get("/api/networks", (req, res) => {
    try {
        res.json({
            success: true,
            settings: {
                usd_to_aed_rate: 3.67,
                user_commission: 0.70,
                admin_commission: 0.30
            }
        });
    } catch(err){
        console.error("Error:", err.message);
        res.status(500).json({ error: "Server error", success: false });
    }
});

// User Sync / Login
app.post("/api/user", async (req, res) => {
    try {
        const { userId, email, name, photoURL, deviceId, deviceFingerprint } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const generatedFingerprint = generateDeviceFingerprint(req);

        if (!userId || !deviceId) {
            return res.status(400).json({ error: "Missing fields", success: false });
        }

        const fraudCheck = await checkDeviceFraud(deviceId, generatedFingerprint, userId);
        if (!fraudCheck.allowed) {
            await logActivity(userId, 'FRAUD_DETECTED', fraudCheck.message, ip);
            return res.status(403).json({ error: fraudCheck.message, success: false });
        }

        let user = await User.findOne({ userId });

        if (!user) {
            user = await User.create({
                userId,
                email,
                name,
                photoURL,
                deviceId,
                deviceFingerprint: generatedFingerprint,
                lastIP: ip,
                lastUserAgent: req.headers['user-agent'],
                lastLogin: new Date(),
                loginCount: 1
            });

            await logActivity(userId, 'SIGNUP', 'New account', ip);
            console.log(`✅ User Created: ${userId}`);
        } else {
            if (user.isBlocked) {
                return res.status(403).json({ error: "Account blocked", success: false });
            }

            user.deviceId = deviceId;
            user.deviceFingerprint = generatedFingerprint;
            user.lastIP = ip;
            user.lastLogin = new Date();
            user.loginCount = (user.loginCount || 0) + 1;
            user.updatedAt = new Date();

            if(photoURL && !user.photoURL){
                user.photoURL = photoURL;
            }

            await user.save();
            await logActivity(userId, 'LOGIN', 'Login', ip);
            console.log(`✅ User Login: ${userId}`);
        }

        res.json({
            success: true,
            user: {
                userId: user.userId,
                name: user.name,
                balance: user.balance,
                totalEarned: user.totalEarned,
                email: user.email,
                photoURL: user.photoURL
            }
        });

    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).json({ error: "Server error", success: false });
    }
});

// Get User Balance
app.get("/api/user/:userId", async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId }).lean();
        if (!user) {
            return res.status(404).json({ error: "User not found", success: false });
        }

        res.json({
            success: true,
            balance: user.balance,
            totalEarned: user.totalEarned
        });
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: "Server error", success: false });
    }
});

// Add Earning
app.post("/api/add-earning", async (req, res) => {
    try {
        const { userId, taskId, amount, site } = req.body;

        if(!userId || !amount || !taskId){
            return res.status(400).json({ error: "Missing fields", success: false });
        }

        const user = await User.findOne({ userId });
        if(!user){
            return res.status(404).json({ error: "User not found", success: false });
        }

        // USD to AED rate
        const aedAmount = amount * 3.67;

        // 70/30 split
        const userShare = aedAmount * 0.70;
        const adminShare = aedAmount * 0.30;

        user.balance = (user.balance || 0) + userShare;
        user.totalEarned = (user.totalEarned || 0) + userShare;
        await user.save();

        await logActivity(
            userId,
            'TASK_COMPLETED',
            `${site} - Task ${taskId} - Earned: ${userShare.toFixed(2)} AED`,
            'system'
        );

        console.log(`✅ EARNING ADDED: ${userId} +${userShare.toFixed(2)} AED from ${site}`);

        res.json({
            success: true,
            newBalance: user.balance.toFixed(2),
            earned: userShare.toFixed(2),
            adminEarned: adminShare.toFixed(2),
            message: "Earning added"
        });

    } catch(err){
        console.error("Add earning error:", err.message);
        res.status(500).json({ error: "Server error", success: false });
    }
});

// Get All Users (Admin)
app.get("/api/admin/users", async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).lean();
        res.json({
            success: true,
            users: users.map(u => ({
                userId: u.userId,
                name: u.name,
                email: u.email,
                balance: u.balance,
                totalEarned: u.totalEarned,
                isBlocked: u.isBlocked,
                fraudScore: Math.min(100, (u.suspiciousActivityCount || 0) * 20),
                createdAt: u.createdAt,
                lastLogin: u.lastLogin
            }))
        });
    } catch(err) {
        res.status(500).json({ error: "Server error", success: false });
    }
});

// Block/Unblock User (Admin)
app.post("/api/admin/user/:userId", async (req, res) => {
    try {
        const { action } = req.body;
        const user = await User.findOne({ userId: req.params.userId });

        if(!user) {
            return res.status(404).json({ error: "User not found", success: false });
        }

        if(action === 'block') {
            user.isBlocked = true;
        } else if(action === 'unblock') {
            user.isBlocked = false;
            user.suspiciousActivityCount = 0;
        }

        await user.save();

        res.json({
            success: true,
            message: action === 'block' ? 'User blocked' : 'User unblocked'
        });
    } catch(err) {
        res.status(500).json({ error: "Server error", success: false });
    }
});

// Fallback
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal error" });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down');
    server.close(() => {
        mongoose.connection.close(false, () => {
            process.exit(0);
        });
    });
});

// ====================== START ======================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log("✅ RealEarn Platform Ready!");
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
});
