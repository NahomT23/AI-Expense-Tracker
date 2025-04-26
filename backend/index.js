import { configDotenv } from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";
import { buildContext } from "graphql-passport";
import mergedTypeDefs from "./typeDefs/index.js";
import mergedResolvers from "./resolvers/index.js";
import { connectDB } from "./db/connectDB.js";
import { configurePassport } from "./passport/passport.config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import bodyParser from "body-parser";
import path from "path";

configDotenv();
configurePassport();

const __dirname = path.resolve();
const app = express();
const httpServer = http.createServer(app);

// MongoDB session store
const MongoDBStore = connectMongo(session);
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

store.on("error", console.error);

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Apollo Server
const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
};

app.use(
  "/graphql",
  cors(corsOptions),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => buildContext({ req, res }),
  })
);

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());

// Enhanced AI Advice Endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !transactions.length) {
      return res.status(400).json({ error: "No transaction data provided" });
    }

    // Analyze transactions
    const totals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, { investment: 0, expense: 0, saving: 0 });

    const categoryFrequency = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    const paymentMethods = transactions.reduce((acc, t) => {
      acc[t.paymentType] = (acc[t.paymentType] || 0) + 1;
      return acc;
    }, {});

    const locations = [...new Set(transactions.map(t => t.location))].filter(l => l !== "Unknown");
    
    const exampleTransactions = transactions
      .slice(0, 5)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const prompt = `Analyze these financial transactions and provide personalized advice:
    Financial Overview:
    - daily, weekly, monthly or yearly Income: $${totals.investment}
    - daily, weekly, monthly or yearly Expenses: $${totals.expense}
    - daily, weekly, monthly or yearly budget: $${totals.saving}
    
    Spending Patterns:
    - Most Frequent Category: ${Object.entries(categoryFrequency).sort((a, b) => b[1] - a[1])[0][0]}
    - Payment Methods: ${Object.entries(paymentMethods).map(([k, v]) => `${k} (${v} transactions)`).join(', ')}
    ${locations.length > 0 ? `- Spending Locations: ${locations.join(', ')}` : ''}

    Recent Transactions:
    ${exampleTransactions.map(t => 
      `- ${new Date(t.date).toLocaleDateString()}: ${t.description} (${t.category}, ${t.paymentType}) - $${t.amount}`
    ).join('\n')}

    Provide advice that:
    1. Evaluates financial health based on these transactions
    2. Highlights notable spending patterns or trends
    3. Suggests specific budget adjustments
    4. Mentions any recurring expenses or unusual transactions
    
    Use a friendly, professional tone and keep it under 7 sentences.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ aiResponse: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate financial advice" });
  }
});

// Static files and client routing
app.use(express.static(path.join(__dirname, "frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

// Start server
const port = process.env.PORT || 4000;
await new Promise((resolve) => httpServer.listen({ port }, resolve));
await connectDB();

console.log(`🚀 Server ready at http://localhost:${port}/graphql`);