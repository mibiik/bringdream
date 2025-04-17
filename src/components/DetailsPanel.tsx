import React from "react";
import { UserCircle, Image, FileText, Cog, Bot, Star, Globe } from "lucide-react";

export const DetailsPanel: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-80 h-full bg-gray-50 dark:bg-neutral-900 border-l border-gray-200 dark:border-gray-800 p-6 gap-6">
      {/* Kullanıcı Profili */}
      <div className="flex flex-col items-center gap-2">
        <img
          src="https://randomuser.me/api/portraits/women/1.jpg"
          alt="Profil"
          className="w-16 h-16 rounded-full border-2 border-purple-400"
        />
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">Defne Öz</div>
        <div className="text-xs text-green-500">Çevrim içi</div>
      </div>
      {/* Medya & Dosyalar */}
      <div>
        <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Image className="w-4 h-4" /> Medya
        </div>
        <div className="flex gap-2">
          <img src="https://placehold.co/48x48" alt="Medya" className="w-12 h-12 rounded-lg object-cover" />
          <img src="https://placehold.co/48x48" alt="Medya" className="w-12 h-12 rounded-lg object-cover" />
        </div>
      </div>
      <div>
        <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Dosyalar
        </div>
        <div className="text-xs text-gray-400">Henüz dosya yok</div>
      </div>
      {/* AI Özetleri & Öneriler */}
      <div>
        <div className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
          <Bot className="w-4 h-4" /> AI Özetleri
        </div>
        <ul className="space-y-1">
          <li className="bg-purple-100 dark:bg-purple-900/60 rounded px-3 py-2 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <Star className="w-3 h-3 text-yellow-400" /> "Rüyanızda geçen semboller: su, köpek, yol..."
          </li>
          <li className="bg-purple-100 dark:bg-purple-900/60 rounded px-3 py-2 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <Globe className="w-3 h-3 text-blue-400" /> "AI: Bu rüya özgürlük arzusunu simgeliyor."
          </li>
        </ul>
      </div>
      {/* Sohbet Ayarları */}
      <div>
        <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Cog className="w-4 h-4" /> Ayarlar
        </div>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">Sohbeti Sessize Al</button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-xs text-red-600 dark:text-red-400">Sohbeti Sil</button>
      </div>
    </aside>
  );
};
