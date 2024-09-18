import { configDotenv } from "dotenv";
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import passport from "passport";
import session from "express-session";
import connectMongo from 'connect-mongodb-session'
import { buildContext } from "graphql-passport";
import mergedTypeDefs from "./typeDefs/index.js"
import mergedResolvers from "./resolvers/index.js"
import { connectDB } from "./db/connectDB.js";
import { configurePassport } from "./passport/passport.config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import bodyParser from 'body-parser'
import path from "path";


const __dirname = path.resolve()

configDotenv();
configurePassport();

const app = express();
const httpServer = http.createServer(app);

const MongoDBStore = connectMongo(session);
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions"
});

store.on('error', (err) => {
  console.log(err);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: "sessions",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true
    },
    store: store
  })
);

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();
app.use(
  '/graphql',
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => buildContext({ req, res }),
  }),
);

// AI ADVICE API CODE
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.post('/api/generate', async (req, res) => {
  const { investment, expense, saving } = req.body;

  if (!investment || !expense || !saving) {
    return res.status(400).json({ error: 'investment, expense, and saving are required' });
  }

  const prompt = `Give me advice on finance in three sentences. I have an income of ${investment}, an expense of ${expense}, and savings of ${saving} in under 5 sentences.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    res.json({ aiResponse: text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

app.post('/api/endpoint', (req, res) => {
  const input = req.body.input;
  console.log('Received input:', input);
  res.json({ message: 'Input received', input });
});


app.use(express.static(path.join(__dirname, "frontend/dist")))

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"))
})

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
await connectDB();

console.log(`🚀 Server ready at http://localhost:4000/graphql`);














































