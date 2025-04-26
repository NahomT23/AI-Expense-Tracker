import { useQuery, useSubscription, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { GET_TRANSACTIONS } from '../graphql/queries/transaction.query';
import { FaRegCopy, FaMicrophone, FaRedoAlt } from "react-icons/fa";

// Color map for the totals cards
const categoryColorMap = {
  budget:  "from-green-500 to-green-500",  // Lighter green
  expense: "from-pink-800 to-pink-600",    // Original pink
  income:  "from-blue-500 to-blue-400",    // Darker blue
};

// Helper to add commas for thousands, millions, etc.
const formatNumber = (num) => {
  if (typeof num !== 'number') return num;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ON_NEW_TRANSACTION = gql`
  subscription OnNewTransaction {
    newTransaction {
      id
      description
      amount
      category
      paymentType
      location
      date
    }
  }
`;

const ON_DELETE_TRANSACTION = gql`
  subscription OnDeleteTransaction {
    deleteTransaction {
      id
      amount
      category
    }
  }
`;

const Advice = () => {
  const [aiAdvice, setAiAdvice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { loading, data, refetch } = useQuery(GET_TRANSACTIONS);

  useSubscription(ON_NEW_TRANSACTION, { onSubscriptionData: refetch });
  useSubscription(ON_DELETE_TRANSACTION, { onSubscriptionData: refetch });

  const analyzeTransactions = () => {
    if (!data?.transactions) return {};

    return data.transactions.reduce((acc, t) => {
      if (!t) return acc;
      if (t.category === 'investment') acc.investment += t.amount;
      if (t.category === 'expense')    acc.expense    += t.amount;
      if (t.category === 'saving')     acc.saving     += t.amount;
      acc.paymentMethods[t.paymentType] = (acc.paymentMethods[t.paymentType] || 0) + 1;
      if (t.location && t.location !== 'Unknown') {
        acc.locations.add(t.location);
      }
      return acc;
    }, { 
      investment: 0, 
      expense:    0, 
      saving:     0,
      paymentMethods: {},
      locations: new Set()
    });
  };

  const handleGenerateAdvice = async () => {
    if (!data?.transactions?.length) {
      toast.error('No transactions to analyze');
      return;
    }

    setIsGenerating(true);
    try {
      // Clean up dates
      const cleanedTransactions = data.transactions.map(t => {
        if (!t || !t.date) {
          console.warn('Invalid transaction or missing date:', t);
          return { ...t, date: new Date().toISOString() };
        }
        const d = new Date(t.date);
        if (isNaN(d)) {
          console.warn(`Invalid date for transaction ${t.id}:`, t.date);
          return { ...t, date: new Date().toISOString() };
        }
        return { ...t, date: d.toISOString() };
      });

      // Identify gym expenses
      const gymExpenses = cleanedTransactions.filter(t =>
        t.category === 'expense' && /gym/i.test(t.description)
      );

      // Send to AI endpoint
      const response = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: cleanedTransactions,
          gymExpenses,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate advice');

      const { aiResponse } = await response.json();
      setAiAdvice(aiResponse);
      toast.success('Personalized advice generated!');
    } catch (error) {
      console.error('Advice Error:', error);
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAdvice = () => {
    navigator.clipboard.writeText(aiAdvice);
    toast.success('Copied to clipboard!');
  };

  const handleSpeakAdvice = () => {
    const utterance = new SpeechSynthesisUtterance(aiAdvice);
    speechSynthesis.speak(utterance);
    toast.success('Reading advice aloud...');
  };

  if (loading) {
    return <div className="text-center p-4">Analyzing your transactions...</div>;
  }

  const stats = analyzeTransactions();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-purple-400">
        Smart Financial Advisor
      </h1>

      <div className="mb-8 p-4 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Transaction Insights</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total Transactions */}
          <div className="p-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">Total Transactions</p>
            <p className="text-2xl font-bold">{data.transactions.length}</p>
          </div>

          {/* Primary Category */}
          <div className="p-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">Primary Category</p>
            <p className="text-2xl font-bold capitalize">
              {Object.entries({
                investment: stats.investment,
                expense:    stats.expense,
                saving:     stats.saving
              })
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </p>
          </div>

          {/* Preferred Payment */}
          <div className="p-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">Preferred Payment</p>
            <p className="text-2xl font-bold capitalize">
              {Object.entries(stats.paymentMethods)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </p>
          </div>

          {/* Total Income (gradient) */}
          <div className={`p-3 rounded-lg bg-gradient-to-r ${categoryColorMap.income}`}>
            <p className="text-sm text-gray-100">Total Income</p>
            <p className="text-2xl font-bold text-white">
              ${formatNumber(stats.investment)}
            </p>
          </div>

          {/* Total Budget (gradient) */}
          <div className={`p-3 rounded-lg bg-gradient-to-r ${categoryColorMap.budget}`}>
            <p className="text-sm text-gray-100">Total Budget</p>
            <p className="text-2xl font-bold text-white">
              ${formatNumber(stats.saving)}
            </p>
          </div>

          {/* Total Expenses (gradient) */}
          <div className={`p-3 rounded-lg bg-gradient-to-r ${categoryColorMap.expense}`}>
            <p className="text-sm text-gray-100">Total Expenses</p>
            <p className="text-2xl font-bold text-white">
              ${formatNumber(stats.expense)}
            </p>
          </div>
        </div>
      </div>

      {!aiAdvice ? (
        <button
          onClick={handleGenerateAdvice}
          disabled={isGenerating}
          className={`w-full py-3 text-lg font-semibold rounded-xl transition-all
            ${isGenerating 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}`}
        >
          {isGenerating ? 'Analyzing Transactions...' : 'Generate Personalized Advice'}
        </button>
      ) : (
        <div className="mt-6 p-6 border border-gray-600 rounded-xl bg-gray-900 relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">AI Financial Report</h2>
              <p className="text-sm text-gray-400">
                Based on {data.transactions.length} transactions
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopyAdvice} title="Copy advice" className="hover:text-purple-400 p-2">
                <FaRegCopy className="text-xl" />
              </button>
              <button onClick={handleSpeakAdvice} title="Read aloud" className="hover:text-purple-400 p-2">
                <FaMicrophone className="text-xl" />
              </button>
              <button onClick={handleGenerateAdvice} title="Regenerate" className="hover:text-purple-400 p-2">
                <FaRedoAlt className="text-xl" />
              </button>
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            {aiAdvice.split('\n').map((line, i) => (
              <p key={i} className="mb-3 text-gray-100">{line}</p>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center text-sm">
            <span className="text-gray-400">
              {new Date().toLocaleDateString()} Analysis
            </span>
            <button onClick={() => setAiAdvice('')} className="text-purple-400 hover:text-purple-300">
              Start New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advice;
