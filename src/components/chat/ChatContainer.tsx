import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { ChatMessage } from "./ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatContainerProps {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
}

interface Message {
  id: string;
  text: string;
  createdAt: any;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isRead: boolean;
}

export function ChatContainer({ chatId, otherUserId, otherUserName }: ChatContainerProps) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(messagesList);
      scrollToBottom();

      // Okunmamış mesajları okundu olarak işaretle
      messagesList
        .filter(m => !m.isRead && m.senderId !== currentUser.uid)
        .forEach(async (m) => {
          await updateDoc(doc(db, "messages", m.id), { isRead: true });
        });
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        chatId,
        text: newMessage,
        createdAt: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Kullanıcı",
        senderAvatar: currentUser.photoURL,
        isRead: false,
      });

      // Sohbetin son mesajını güncelle
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: {
          text: newMessage,
          createdAt: serverTimestamp(),
          senderId: currentUser.uid,
        },
      });

      setNewMessage("");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={{
              ...message,
              createdAt: message.createdAt?.toDate?.().toLocaleString("tr-TR") || "",
            }}
            isOwnMessage={message.senderId === currentUser?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}