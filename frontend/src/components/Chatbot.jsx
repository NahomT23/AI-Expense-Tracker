// src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaComments } from "react-icons/fa";
import toast from "react-hot-toast";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm your finance assistant. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { sender: "user", text }]);
    setInput("");

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chatbot error");
      setMessages((m) => [...m, { sender: "bot", text: json.response }]);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to send message");
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
        >
          <FaComments size={24} />
        </button>
      </div>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-lg flex flex-col z-50">
          {/* Chat messages */}
          <div className="flex-1 p-3 overflow-y-auto text-gray-100">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${m.sender === "bot" ? "text-left" : "text-right"}`}
              >
                <span
                  className={`inline-block px-3 py-2 rounded-lg ${
                    m.sender === "bot"
                      ? "bg-gray-800"
                      : "bg-indigo-700"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {/* Input area */}
          <div className="p-2 border-t border-gray-700 flex bg-gray-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me about your finances…"
              className="flex-1 p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-l focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="px-3 bg-indigo-600 text-white rounded-r hover:bg-indigo-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
