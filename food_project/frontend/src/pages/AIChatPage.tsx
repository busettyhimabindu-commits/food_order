import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, Plus, User } from 'lucide-react';
import { aiService } from '../services/aiService';
import { foodService } from '../services/foodService';
import { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  foods?: FoodItem[];
}

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Welcome to Foodie AI 🤖! Ask me any culinary request like 'Show spicy biryani under ₹250', 'Recommend healthy vegetarian options', or 'What should I order today?'"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [samplePrompts, setSamplePrompts] = useState<string[]>([
    "I want something spicy under ₹250",
    "Show vegetarian food",
    "What should I order today?",
    "Recommend something healthy"
  ]);

  useEffect(() => {
    foodService.getSearchSuggestions().then((suggestions) => {
      if (suggestions && suggestions.length > 0) {
        setSamplePrompts(suggestions.map((s) => `Show me best ${s}`));
      }
    }).catch(console.error);
  }, []);

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
      const response = await aiService.sendChatMessage(queryText);
      const botMsg: Message = {
        sender: 'bot',
        text: response.reply,
        foods: response.recommended_foods
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Sorry, I encountered an issue parsing your query. Please try again!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[700px]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white shadow-warm-glow">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <span>Foodie AI Assistant</span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-xs text-slate-300">Live Database Food Query & Intent Solver</p>
          </div>
        </div>

        {/* Chat Trajectory */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-[80%] ${msg.sender === 'user' ? 'bg-brand-600 text-white rounded-3xl rounded-tr-xs p-4 shadow-sm' : 'bg-white text-slate-900 rounded-3xl rounded-tl-xs p-5 border border-slate-100 shadow-sm'}`}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>

                {msg.foods && msg.foods.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Database Matches Available:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.foods.map((food) => (
                        <div key={food.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
                          <div className="flex gap-2">
                            <img src={food.image_url} alt={food.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{food.name}</h5>
                              <p className="text-[10px] text-brand-600 font-semibold">{food.restaurant_name}</p>
                              <span className="text-xs font-extrabold text-slate-900 block mt-0.5">{formatCurrency(food.price)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(food)}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-14">
              <Sparkles className="w-4 h-4 animate-spin text-brand-500" />
              <span>Foodie AI is querying the menu database...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Prompt Chips */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="whitespace-nowrap text-xs font-semibold bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-600 px-3.5 py-1.5 rounded-full border border-slate-200 transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your food request (e.g., 'butter chicken under 350')..."
            className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-400 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2 text-sm"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AIChatPage;
