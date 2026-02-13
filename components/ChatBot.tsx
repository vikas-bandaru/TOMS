import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, X } from 'lucide-react';
import { chatWithData } from '../services/geminiService';
import { ChatMessage, TrainingSession, MeetingRecord } from '../types';

interface Props {
  sessions: TrainingSession[];
  meetings: MeetingRecord[];
}

const ChatBot: React.FC<Props> = ({ sessions, meetings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello. I am the TOMS Architect Agent. Query me about schedules, policies, or conflicts.', timestamp: new Date() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Prepare context
    const context = JSON.stringify({
        currentSchedule: sessions,
        recentMeetingDecisions: meetings.map(m => ({ date: m.date, decisions: m.decisions, policies: m.summary }))
    });

    const response = await chatWithData(input, context);
    
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response || "Analysis failed.", timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-all hover:scale-110 z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden font-sans">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-bold">TOMS Architect AI</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded">
            <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                    {m.text}
                </div>
            </div>
        ))}
        {loading && <div className="text-xs text-slate-400 text-center animate-pulse">Reasoning...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input 
            type="text" 
            className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ask about schedule conflicts..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50"
        >
            <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;