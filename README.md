# RealEarn Platform

A complete earning platform where users can earn money through ads, games, and surveys. Features include Firebase authentication, device tracking, anti-fraud system, and an admin panel.

## Features

- **User Authentication**: Firebase-based email/password and Google login
- **Earning System**: Earn money through ads, games, and surveys
- **Device Tracking**: Unique device fingerprinting for each user
- **Anti-Fraud System**: Prevents multiple accounts and suspicious activity
- **Admin Panel**: Manage users, view statistics, block suspicious accounts
- **Real-time Dashboard**: Track balance and earnings history

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build
- Tailwind CSS for styling
- React Router for navigation
- Firebase Authentication & Firestore
- Recharts for statistics

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Rate limiting & Helmet security
- Device fingerprinting

## Setup Instructions

### 1. Frontend Setup (React)

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build
```

### 2. Backend Setup (Node.js)

```bash
# Create .env file with your MongoDB URI
cp .env.example .env

# Edit .env with your MongoDB connection string
# Format: mongodb+srv://username:password@cluster.mongodb.net/realearn

# Install backend dependencies
npm install

# Start server
npm start
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable Authentication (Email/Password + Google)
4. Create Firestore Database
5. Copy your config to `src/services/firebase.ts`

## Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Upload dist folder to Vercel/Netlify
```

### Backend (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set root directory
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variable:
   - `MONGO_URI` = your MongoDB connection string

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/networks` | Get network settings |
| POST | `/api/user` | User sync/login |
| GET | `/api/user/:userId` | Get user balance |
| POST | `/api/add-earning` | Add earning |
| GET | `/api/admin/users` | Get all users (admin) |
| POST | `/api/admin/user/:userId` | Block/unblock user |

## Project Structure

```
earn-platform/
├── src/
│   ├── components/       # Reusable components
│   ├── context/           # React contexts (Auth, Earning)
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   │   ├── auth/          # Login, Signup
│   │   ├── admin/         # Admin panel
│   │   ├── Dashboard.tsx
│   │   ├── Games.tsx
│   │   └── Surveys.tsx
│   ├── services/          # Firebase, Ads, Tracking
│   ├── App.tsx            # Main app with routes
│   └── main.tsx           # Entry point
├── server.js              # Node.js backend
├── server-package.json    # Backend dependencies
└── package.json          # Frontend dependencies
```

## Security Features

- Rate limiting on API endpoints
- Helmet.js security headers
- Device fingerprinting
- Fraud detection system
- Account blocking for suspicious activity
- CORS configuration

## License

MIT License - Feel free to use and modify.

---

**Author**: RealEarn Team
**Version**: 1.0.0
