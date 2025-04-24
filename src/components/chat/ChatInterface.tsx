import { useState, useEffect } from 'react';
import { findOrCreateChat, updateUnreadCount } from '@/lib/chat';
import { useAuth } from '@/components/auth-provider';
import { ChatContainer } from './ChatContainer';

interface ChatInterfaceProps {
  receiverId: string;
  receiverName: string;
}

export function ChatInterface({ receiverId, receiverName }: ChatInterfaceProps) {
  const { currentUser } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser || !receiverId) return;

      try {
        setLoading(true);
        setError(null);
        // Mevcut sohbeti bul veya yeni sohbet oluştur
        const newChatId = await findOrCreateChat(currentUser.uid, receiverId);
        setChatId(newChatId);

        // Okunmamış mesaj sayısını sıfırla
        if (newChatId) {
          await updateUnreadCount(newChatId, currentUser.uid);
        }
      } catch (err) {
        console.error('Sohbet başlatma hatası:', err);
        setError('Sohbet başlatılırken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [currentUser, receiverId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Sohbet yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold">{receiverName}</h2>
      </div>
      <ChatContainer
        chatId={chatId}
        otherUserId={receiverId}
        otherUserName={receiverName}
      />
    </div>
  );
}