import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  userDetails: {
    [key: string]: {
      name: string;
      avatar?: string;
    };
  };
}

interface ChatListProps {
  onChatSelect: (chatId: string, userId: string, userName: string) => void;
  selectedChatId?: string;
}

export function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessage.createdAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];

      setChats(chatsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherParticipant = (chat: Chat) => {
    if (!currentUser) return null;
    const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
    return otherUserId ? {
      id: otherUserId,
      ...chat.userDetails[otherUserId]
    } : null;
  };

  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return date.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (days === 1) {
        return "Dün";
      } else if (days < 7) {
        return date.toLocaleDateString("tr-TR", { weekday: "long" });
      } else {
        return date.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      }
    } catch (error) {
      console.error("Tarih formatı hatası:", error);
      return "";
    }
  };

  const filteredChats = chats.filter((chat) => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    return otherUser.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sohbet ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? "Arama sonucu bulunamadı" : "Henüz sohbet yok"}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            if (!otherUser) return null;

            return (
              <Button
                key={chat.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start px-4 py-3 h-auto hover:bg-accent",
                  selectedChatId === chat.id && "bg-accent"
                )}
                onClick={() => onChatSelect(chat.id, otherUser.id, otherUser.name)}
              >
                <div className="flex items-start gap-3 w-full">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                    <AvatarFallback>
                      {otherUser.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{otherUser.name}</span>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage?.text || "Henüz mesaj yok"}
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}