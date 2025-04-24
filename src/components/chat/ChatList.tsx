import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { ChatInterface } from "./ChatInterface";
import { UserSearch } from "./UserSearch";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Chat {
  id?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  userName?: string;
}

export const ChatList = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  useEffect(() => {
    const handleStartChat = (event: any) => {
      const { userId, userName } = event.detail;
      setSelectedChat(userId);
      setSelectedUserName(userName);
    };

    window.addEventListener('startChat', handleStartChat);
    return () => window.removeEventListener('startChat', handleStartChat);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];

      // Her sohbet için diğer kullanıcının bilgilerini al
      const chatsWithUserInfo = await Promise.all(
        chatsData.map(async (chat) => {
          const otherUserId = getOtherParticipant(chat);
          const userRef = doc(db, 'users', otherUserId);
          const userSnap = await getDoc(userRef);
          return {
            ...chat,
            userName: userSnap.exists() ? userSnap.data().displayName : 'Kullanıcı'
          };
        })
      );

      setChats(chatsWithUserInfo);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((id) => id !== currentUser?.uid) || "";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Mesajlar</h2>
        </div>
        <UserSearch
          onSelectUser={(userId, userName) => {
            setSelectedChat(userId);
            setSelectedUserName(userName);
          }}
        />
        <div className="overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                const otherUserId = getOtherParticipant(chat);
                setSelectedChat(otherUserId);
                setSelectedUserName(chat.userName || 'Kullanıcı');
              }}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChat === getOtherParticipant(chat) ? "bg-blue-50" : ""}`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="font-semibold">{chat.userName || 'Kullanıcı'}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.lastMessageTime && (
                  <span className="text-xs text-gray-400">
                    {chat.lastMessageTime.toDate().toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4">
        {selectedChat ? (
          <ChatInterface
            receiverId={selectedChat}
            receiverName={selectedUserName}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Sohbet başlatmak için bir kullanıcı seçin</p>
          </div>
        )}
      </div>
    </div>
  );
};