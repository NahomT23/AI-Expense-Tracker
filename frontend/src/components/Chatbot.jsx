import React, { useState, useEffect, useRef } from "react";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import Markdown from "react-markdown";
import toast from "react-hot-toast";
import { useQuery } from "@apollo/client";
import { GET_AUTHENTICATED_USER } from "../graphql/queries/user.query";

const Chatbot = () => {
  const { data } = useQuery(GET_AUTHENTICATED_USER);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);
  const authUser = data?.authUser;

  useEffect(() => {
    if (open && messages.length === 0 && authUser) {
      setMessages([{
        sender: "bot",
        content: `Hi **${authUser.username}**! I'm your financial assistant. Ask me about your spending patterns, budgets, or transactions! 💰`
      }]);
    }
  }, [open, authUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !authUser) return;
  
    setMessages(prev => [...prev, { sender: "user", content }]);
    setInput("");
    setIsTyping(true);
  
    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
  
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to get response");
      }
  
      setMessages(prev => [...prev, { 
        sender: "bot", 
        content: responseData.response || "I'm having trouble responding right now"
      }]);
      
    } catch (error) {
      setMessages(prev => [...prev, {
        sender: "bot",
        content: `Error: ${error.message} - Please try again later`
      }]);
      console.error("Chat error:", error);
      toast.error(error.message);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen(!open)}
        className={`p-4 transition-all duration-300 ${
          open ? "bg-red-500 rotate-45" : "bg-indigo-600 hover:bg-indigo-700"
        } rounded-full shadow-lg text-white`}
      >
        {open ? <FaTimes size={24} /> : <FaComments size={24} />}
      </button>

      {open && (
        <div className="absolute bottom-20 right-0 w-80 h-[500px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-800 flex items-center gap-2">
            <MdAttachMoney className="text-2xl text-green-400" />
            <h2 className="text-lg font-bold text-gray-100">Finance Assistant</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <Markdown >
                    {msg.content}

                  </Markdown>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-sm">Analyzing transactions...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your finances..."
                className="flex-1 bg-gray-700 text-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                disabled={isTyping}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white disabled:opacity-50"
              >
                <FaPaperPlane className="text-lg" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              I can only discuss your financial transactions and patterns
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;