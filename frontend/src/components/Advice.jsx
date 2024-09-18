import { useQuery, useSubscription, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { GET_TRANSACTIONS } from '../graphql/queries/transaction.query';
import { FaRegCopy, FaMicrophone } from "react-icons/fa";

// Define the subscription for new transactions
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

// Define the subscription for deleted transactions
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
  const [isAdviceGenerated, setIsAdviceGenerated] = useState(false);
  const { loading, data, refetch } = useQuery(GET_TRANSACTIONS);

  const [investment, setInvestment] = useState(0);
  const [expense, setExpense] = useState(0);
  const [saving, setSaving] = useState(0);
  const [missingCategory, setMissingCategory] = useState('');

  useSubscription(ON_NEW_TRANSACTION, {
    onSubscriptionData: () => {
      refetch(); // Refetch the transactions data when a new transaction is received
    },
  });

  useSubscription(ON_DELETE_TRANSACTION, {
    onSubscriptionData: () => {
      refetch(); // Refetch the transactions data when a transaction is deleted
    },
  });

  useEffect(() => {
    if (data && data.transactions) {
      const totalInvestment = data.transactions
        .filter((t) => t.category === 'investment')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = data.transactions
        .filter((t) => t.category === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSaving = data.transactions
        .filter((t) => t.category === 'saving')
        .reduce((sum, t) => sum + t.amount, 0);

      setInvestment(totalInvestment);
      setExpense(totalExpense);
      setSaving(totalSaving);

      // Check if any category is now empty after a transaction update
      if (investment > 0 && totalInvestment === 0) {
        setAiAdvice(''); // Clear AI advice
        setMissingCategory('investment');
        toast.error('Investment category is now empty. Please add an investment.');
      } else if (expense > 0 && totalExpense === 0) {
        setAiAdvice(''); // Clear AI advice
        setMissingCategory('expense');
        toast.error('Expense category is now empty. Please add an expense.');
      } else if (saving > 0 && totalSaving === 0) {
        setAiAdvice(''); // Clear AI advice
        setMissingCategory('saving');
        toast.error('Saving category is now empty. Please add a saving.');
      } else {
        setMissingCategory(''); // Reset missing category if all are present
      }
    }
  }, [data]);

  useEffect(() => {
    if (isAdviceGenerated && investment > 0 && expense > 0 && saving > 0) {
      handleGenerateAdvice();
    }
  }, [investment, expense, saving]);

  const handleGenerateAdvice = async () => {
    if (investment === 0) {
      toast.error('Please add an Income');
    } else if (expense === 0) {
      toast.error('Please add an Expense');
    } else if (saving === 0) {
      toast.error('Please add a Budget');
    } else {
      try {
        const response = await fetch('http://localhost:4000/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ investment, expense, saving }),
        });

        const result = await response.json();
        if (response.ok) {
          setAiAdvice(result.aiResponse);
          if (isAdviceGenerated) {
            toast.success('Advice updated successfully');
          } else {
            setIsAdviceGenerated(true);
            toast.success('Advice generated successfully');
          }
        } else {
          console.error('Error:', result.error || 'Failed to get advice');
        }
      } catch (error) {
        console.error('Request failed:', error);
      }
    }
  };

  const handleCopyAdvice = () => {
    if (aiAdvice) {
      navigator.clipboard.writeText(aiAdvice);
      toast.success('AI advice copied to clipboard');
    }
  };

  const handleSpeakAdvice = () => {
    if (aiAdvice) {
      const utterance = new SpeechSynthesisUtterance(aiAdvice);
      speechSynthesis.speak(utterance);
      toast.success('Listening to AI advice');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {aiAdvice ? 'Your AI Generated Financial Advice' : 'Generate Financial Advice'}
      </h1>

      {missingCategory && (
        <p className="text-center">Please add the {missingCategory} to get AI advice</p>
      )}

      {!aiAdvice && !missingCategory && (investment > 0 || expense > 0 || saving > 0) && !isAdviceGenerated && (
        <button
          onClick={handleGenerateAdvice}
          className="w-full py-2 bg-gradient-to-br from-pink-500 to-pink-600 text-white font-bold rounded hover:bg-gradient-to-bl"
        >
          Generate AI Advice
        </button>
      )}

      {aiAdvice && (
        <div className="mt-4 p-4 border rounded bg-gray-900">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">AI Advice:</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handleCopyAdvice} 
                aria-label="Copy AI advice" 
                className="hover:text-pink-500 hover:scale-110 transition-transform duration-300"
              >
                <FaRegCopy className="cursor-pointer text-xl" />
              </button>
              <button 
                onClick={handleSpeakAdvice} 
                aria-label="Listen to AI advice" 
                className="hover:text-pink-500 hover:scale-110 transition-transform duration-300"
              >
                <FaMicrophone className="cursor-pointer text-xl" />
              </button>
            </div>
          </div>
          <p>{aiAdvice}</p>
        </div>
      )}
    </div>
  );
};

export default Advice;
