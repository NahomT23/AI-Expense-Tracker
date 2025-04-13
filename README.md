# 💰 Expense Tracker AI

A beautifully designed, fully responsive expense tracking web application built with React, Tailwind CSS, Apollo Client, and a Node.js/Express backend. It integrates Passport.js for authentication, MongoDB with Mongoose for storage, GraphQL for seamless data flow, and Gemini AI for intelligent advice based on your financial data.


---

## 🧠 Introduction

Track your income, budget, and expenses all in one place and get personalized financial advice powered by AI. View comprehensive analytics and insights based on your financial activity through interactive charts. The app is optimized for mobile and desktop, ensuring a seamless experience across all devices.

---

## ✨ Features

- 📊 Add and manage budgets, savings, and expenses
- 📈 Visual analytics and charts
- 🤖 AI-based financial advice powered by Gemini AI
- 🔐 Secure user authentication with Passport.js
- 🌐 GraphQL API integration
- 🎨 Responsive UI with React and Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
- React
- Tailwind CSS
- Apollo Client
- Vite

### Backend
- Node.js
- Express.js
- GraphQL
- MongoDB + Mongoose
- Passport.js
- Gemini AI API

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/NahomT23/AI-Expense-Tracker.git

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 🚀 Usage

### Backend

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

### Frontend

```bash
# Start development server
npm run dev

# Build frontend assets
npm run build
```

---

## ⚙️ Configuration

Create a `.env` file in both `backend` and `frontend` directories with necessary environment variables:

### Backend Example

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Example

```env
VITE_API_URL=http://localhost:5000/graphql
```

---

## 🧪 Examples

- Add your monthly budget, savings goals, and daily expenses.
- View line/bar/pie charts for income vs expenses.
- Click **Get Advice** to receive AI-generated insights and suggestions.

---

## 🛠️ Troubleshooting

- Ensure MongoDB is running and accessible via `MONGO_URI`.
- Confirm your Gemini AI API key is valid.
- CORS issues? Make sure the frontend is calling the correct backend URL.
