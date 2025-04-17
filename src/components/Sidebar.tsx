import React from "react";
import { UserCircle, Search, Bot, MessageSquare } from "lucide-react";

// Dummy data for conversations (replace with real data later)
const conversations = [
  {
    id: 1,
    name: "Defne Öz",
    lastMessage: "Görüşürüz!",
    time: "16:45",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    ai: false,
    selected: true,
  },
  {
    id: 2,
    name: "Ahmet Demir",
    lastMessage: "AI: Rüyan ilginçmiş!",
    time: "15:20",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    ai: true,
    selected: false,
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-20 md:w-72 h-full bg-gray-100 dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Profil ve Arama */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
        <img
          src={conversations[0].avatar}
          alt="Profil"
          className="w-10 h-10 rounded-full border-2 border-blue-400"
        />
        <span className="hidden md:block font-semibold text-gray-800 dark:text-gray-100 ml-2">
          {conversations[0].name}
        </span>
        <button className="ml-auto p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Search className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      {/* Sohbet Listesi */}
      <nav className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all select-none group ${
              conv.selected
                ? "bg-blue-100 dark:bg-purple-900/40 border-l-4 border-blue-500"
                : "hover:bg-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            <img
              src={conv.avatar}
              alt={conv.name}
              className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate font-medium text-sm text-gray-900 dark:text-gray-100">
                  {conv.name}
                </span>
                {conv.ai && (
                  <Bot className="w-4 h-4 text-purple-500 ml-1" title="AI Bot" />
                )}
              </div>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                {conv.lastMessage}
              </span>
            </div>
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
              {conv.time}
            </span>
          </div>
        ))}
      </nav>
      {/* Alt Menü veya AI Kısayolları */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <MessageSquare className="w-5 h-5 text-blue-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Bot className="w-5 h-5 text-purple-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <UserCircle className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </aside>
  );
};
