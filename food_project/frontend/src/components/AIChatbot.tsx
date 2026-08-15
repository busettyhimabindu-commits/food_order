import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import { supportService } from '../services/supportService';
import { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { modalContentVariants, transitionFast } from '../utils/motion';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  foods?: FoodItem[];
}

interface AIChatbotProps {
  orderId?: number;
  embedded?: boolean;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ orderId, embedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: embedded 
        ? "Hello! I'm your Order Assistant 🤖. Ask me 'Where is my order?' or 'Can I cancel?'"
        : "Hello! I'm Foodie AI 🤖. Ask me things like 'spicy biryani under ₹300' or 'vegetarian dinner recommendations'!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = embedded ? [
    "Where is my order?",
    "What did I order?",
    "Can I cancel?"
  ] : [
    "Something spicy under ₹200 🌶️",
    "Show me desserts near me 🍰",
    "Vegetarian dinner ideas 🥗",
    "Fastest delivery options ⚡"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    const userMsg: Message = { sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await aiService.sendChatMessage(queryText, orderId);
      const botMsg: Message = {
        sender: 'bot',
        text: response.reply,
        foods: response.recommended_foods
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Sorry, I had trouble processing your request. Would you like to connect to human support?" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupportTicket = async () => {
    try {
      await supportService.createTicket({ order_id: orderId, message: input || "Human support request from chat" });
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "🎫 Support ticket created! Our support team will review your query and reply shortly." }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const chatContent = (
    <>
      {/* Premium Header */}
      <div className="bg-[#141414] text-white p-4.5 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FFA726] flex items-center justify-center text-white shadow-warm-accent">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#141414]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold font-display flex items-center gap-1.5 text-white tracking-tight">
              <span>{embedded ? "Order Assistant" : "Foodie AI"}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {embedded ? "Live Order Support" : "Finding your perfect meal..."}
            </p>
          </div>
        </div>
        {!embedded && (
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#FAF7F2] space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-xl flex shrink-0 items-center justify-center mt-1 text-xs ${
                msg.sender === 'user'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-gradient-to-tr from-[#FF5722] to-[#FFA726] text-white shadow-warm-accent'
              }`}>
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`rounded-2xl px-4 py-3 text-xs font-medium leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white rounded-tr-xs font-display shadow-warm-accent'
                  : 'bg-white border border-[#E8E2D9] text-[#141414] rounded-tl-xs shadow-soft-layered'
              }`}>
                <p className="leading-relaxed">{msg.text}</p>

                {/* Food Recommendations inside chat */}
                {msg.foods && msg.foods.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.foods.map((food) => (
                      <div key={food.id} className="flex items-center gap-3 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
                        {food.image_url ? (
                          <img src={food.image_url} alt={food.name} className="w-12 h-12 rounded-lg object-cover shadow-xs" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-400 text-xs">No img</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold font-display text-[#141414] truncate leading-tight">{food.name}</p>
                          <p className="font-extrabold font-display text-[#FF5722] mt-0.5">{formatCurrency(food.price)}</p>
                        </div>
                        <button
                          onClick={() => addToCart(food, 1)}
                          className="w-8 h-8 rounded-xl bg-[#FF5722] text-white flex items-center justify-center shrink-0 hover:bg-[#E64A19] transition-colors shadow-warm-accent"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF5722] to-[#FFA726] text-white flex shrink-0 items-center justify-center mt-1 shadow-warm-accent">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-[#E8E2D9] rounded-2xl rounded-tl-xs px-4 py-3 shadow-soft-layered flex items-center gap-1.5">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-[#FF5722] rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-[#FF5722] rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-[#FF5722] rounded-full" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-2.5 border-t border-[#E8E2D9] bg-white flex gap-2 overflow-x-auto no-scrollbar">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-[11px] font-bold font-display bg-[#FAF7F2] hover:bg-[#FF5722]/10 text-slate-700 hover:text-[#FF5722] border border-[#E8E2D9] px-3 py-1.5 rounded-full shrink-0 transition-all shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Footer Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3.5 bg-white border-t border-[#E8E2D9] flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={embedded ? "Ask about your order..." : "Ask about dishes, spices, budget..."}
          className="flex-1 bg-[#FAF7F2] border border-[#E8E2D9] focus:bg-white focus:border-[#FF5722] text-xs text-[#141414] rounded-xl px-4 py-3 focus:outline-none font-medium transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-[#FF5722] hover:bg-[#E64A19] text-white p-3 rounded-xl shadow-warm-accent disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full bg-white rounded-[24px] border border-[#E8E2D9] shadow-soft-layered overflow-hidden flex flex-col h-[500px]">
        {chatContent}
      </div>
    );
  }

  return (
    <>
      {/* Floating Chat Trigger Button with Sparkle Animation */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-[#141414] via-[#242424] to-[#141414] text-white p-3.5 px-4 rounded-full shadow-2xl hover:shadow-warm-accent transition-all duration-300 flex items-center gap-2.5 border border-white/20 group"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FFA726] flex items-center justify-center text-white shadow-warm-accent">
              <Bot className="w-4 h-4" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 text-amber-400"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            </motion.div>
          </div>
          <span className="font-extrabold font-display text-xs tracking-tight text-white pr-1 hidden sm:inline">
            Foodie AI
          </span>
        </motion.button>
      )}

      {/* Floating Chat Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalContentVariants}
            className="fixed bottom-6 left-6 z-50 w-full max-w-md bg-white rounded-[24px] shadow-2xl border border-[#E8E2D9] overflow-hidden flex flex-col h-[550px]"
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
