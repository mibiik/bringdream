import React from "react";
import { Bot, CheckCircle, Smile, Paperclip, Mic, Sparkles } from "lucide-react";

// Dummy data for messages (replace with real data later)
const messages = [
  {
    id: 1,
    sender: "me",
    text: "Merhaba! Nasılsın?",
    time: "16:45",
  },
  {
    id: 2,
    sender: "other",
    text: "İyiyim, sen?",
    time: "16:46",
  },
  {
    id: 3,
    sender: "ai",
    text: "AI: Size yardımcı olabilirim!",
    time: "16:46",
  },
];

export const ChatPanel: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  return (
    <section className="flex flex-col flex-1 h-full bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className={`flex items-center gap-3 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-gray-200 dark:border-gray-800`}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">D</div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-gray-100">Defne Öz</div>
          <div className="text-xs text-green-500 flex items-center gap-1">● Çevrim içi</div>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Sparkles className="w-5 h-5 text-purple-500" title="AI Özetle" />
        </button>
      </div>
      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : msg.sender === "ai" ? "justify-center" : "justify-start"}`}
          >
            <div
              className={`relative max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow transition-all group
                ${msg.sender === "me"
                  ? "bg-blue-100 dark:bg-blue-900 text-right text-gray-900 dark:text-gray-100 rounded-br-md"
                  : msg.sender === "ai"
                  ? "bg-gradient-to-tr from-purple-200 via-yellow-100 to-white dark:from-purple-900/70 dark:via-yellow-900/30 dark:to-neutral-900 text-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-700 font-semibold rounded-3xl"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
              }`}
            >
              {msg.text}
              <div className="flex items-center gap-1 mt-1 opacity-70 text-xs justify-end">
                <span>{msg.time}</span>
                {msg.sender === "me" && <CheckCircle className="w-3 h-3 text-blue-400" />}
                {msg.sender === "ai" && <Bot className="w-3 h-3 text-purple-400 ml-1" title="AI" />}
              </div>
              {/* Hover tepkileri */}
              <div className="absolute -top-7 right-0 left-0 mx-auto w-max opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto flex gap-1">
                <button className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 text-xs shadow hover:bg-gray-100 dark:hover:bg-neutral-800">😀</button>
                <button className="bg-white dark:bg-neutral-900 border border-purple-300 dark:border-purple-700 rounded-full px-2 py-1 text-xs shadow hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> AI ile cevap öner
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Mesaj Yazma Alanı */}
      <form className={`flex items-end gap-2 ${isMobile ? 'px-3 py-3' : 'px-4 py-4'} border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950`}>
        <button type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Smile className="w-5 h-5 text-yellow-500" />
        </button>
        <button type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Paperclip className="w-5 h-5 text-gray-400" />
        </button>
        <input
          type="text"
          className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-purple-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Yazarken AI öneriyor..."
        />
        <button type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Mic className="w-5 h-5 text-gray-400" />
        </button>
        <button type="submit" className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button type="button" className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/60">
          <Sparkles className="w-5 h-5 text-purple-500" title="AI'dan cevap iste" />
        </button>
      </form>
      {/* AI Öneri Kutuları */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button className="bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full shadow text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition">🎉 Esprili cevap</button>
        <button className="bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-200 px-3 py-1 rounded-full shadow text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800 transition">💬 Kibar cevap</button>
        <button className="bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-200 px-3 py-1 rounded-full shadow text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition">🧠 Bilgi ver</button>
      </div>
    </section>
  );
};
