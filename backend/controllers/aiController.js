import { configDotenv } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Transaction from '../models/transaction.model.js';

configDotenv();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAdvice = async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !transactions.length) {
      return res.status(400).json({ error: "No transaction data provided" });
    }

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

    const exampleTransactions = transactions
      .slice(0, 5)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const prompt = `Analyze these financial transactions and provide personalized advice:
    Financial Overview:
    - Income: $${totals.investment}
    - Expenses: $${totals.expense}
    - Budget: $${totals.saving}
    
    Spending Patterns:
    - Most Frequent Category: ${Object.entries(categoryFrequency).sort((a, b) => b[1] - a[1])[0][0]}
    - Payment Methods: ${Object.entries(paymentMethods).map(([k, v]) => `${k} (${v} transactions)`).join(', ')}
    Recent Transactions:
    ${exampleTransactions.map(t => 
      `- ${new Date(t.date).toLocaleDateString()}: ${t.description} (${t.category}, ${t.paymentType}) - $${t.amount}`
    ).join('\n')}

    Provide advice that:
    1. Evaluates financial health
    2. Highlights spending patterns
    3. Suggests budget adjustments
    4. Notes recurring/unusual expenses
    
    Use friendly, professional tone under 7 sentences.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ aiResponse: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate financial advice" });
  }
};

export const handleChat = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const text = (message?.trim() || '').toLowerCase();
    const userName = user.name || 'your';

    // Handle greetings
    const greetings = ['hey', 'hi', 'hello', 'howdy'];
    if (greetings.some(greeting => text.startsWith(greeting))) {
      return res.json({ response: `Hello ${userName}! How can I assist you today?` });
    }

    // Identity questions
    const identityPhrases = ['who are you', 'what are you', 'your name'];
    if (identityPhrases.some(phrase => text.includes(phrase))) {
      return res.json({ response: `I'm ${userName}'s financial assistant. How can I help?` });
    }

    // Financial context check
    const financeKeywords = [
      'budget', 'expense', 'investment', 'saving', 'income', 
      'transactions', 'financial', 'payment', 'category', 'balance'
    ];
    const keywordPattern = new RegExp(`\\b(${financeKeywords.join('|')})\\b`, 'i');
    if (!keywordPattern.test(text)) {
      return res.json({ response: "I can only discuss financial transactions and patterns." });
    }

    // Fetch transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    if (!transactions.length) {
      return res.json({ response: "No transactions to analyze yet." });
    }

    // Build prompt
    const prompt = `Act as ${userName}'s financial analyst. Query: "${text}"
    Transactions:
    ${transactions.map(t => 
      `- ${t.date}: ${t.description} [${t.category}] $${t.amount}`
    ).join('\n')}

    Response Guidelines:
    1. Address as ${userName}
    2. Direct answer first
    3. Note inconsistencies
    4. Keep concise`;

    const result = await model.generateContent(prompt);
    const aiResponse = await (await result.response).text();
    
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ response: "Error processing request." });
  }
};