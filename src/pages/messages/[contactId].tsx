import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../lib/auth";
import { query } from "firebase/firestore";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  imageUrl: string | null;
}

interface Contact {
  id: string;
  displayName: string;
  photoURL: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
}

const MessageDetail = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { contactId } = router.query;
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser || !contactId) return;
    // Burada Firestore'dan ilgili mesajları çekebilirsiniz
    // setMessages(...)
    // setContact(...)
    setLoading(false);
  }, [currentUser, contactId]);

  if (loading) return <div>Yükleniyor...</div>;
  if (!contactId) return <div>Geçersiz ID</div>;

  return (
    <div>
      <h2>Mesaj Detayı: {contact?.displayName || contactId}</h2>
      {/* Mesajları burada listeleyin */}
      <div>
        {messages.length === 0 ? (
          <p>Hiç mesaj yok.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>{msg.text}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageDetail;
