import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/components/auth-provider";
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs, doc, getDoc, updateDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Send, ArrowLeft, Image as ImageIcon, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
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

const Messages = () => {
  const { currentUser } = useAuth();
  const { contactId } = useParams<{ contactId: string }>();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showContacts, setShowContacts] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const contactsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(contactsQuery, async (snapshot) => {
      const contactsData: Contact[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.data();
          
          if (userData) {
            contactsData.push({
              id: otherUserId,
              displayName: userData.displayName || "Kullanıcı",
              photoURL: userData.photoURL,
              lastMessage: data.lastMessage || "",
              lastMessageTime: data.updatedAt ? data.updatedAt.toDate() : new Date(),
              unread: data.unreadBy?.includes(currentUser.uid) || false
            });
          }
        }
      }
      
      // Sort contacts by last message time
      contactsData.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      
      setContacts(contactsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!contactId) return;
    if (selectedContact || loading) return;
    const existing = contacts.find(c => c.id === contactId);
    if (existing) {
      selectContact(existing);
    } else {
      (async () => {
        const userDoc = await getDoc(doc(db, "users", contactId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          selectContact({
            id: contactId,
            displayName: data.displayName || "Kullanıcı",
            photoURL: data.photoURL || null,
            lastMessage: "",
            lastMessageTime: new Date(),
            unread: false,
          });
        }
      })();
    }
  }, [contactId, contacts, selectedContact, loading]);

  const selectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    setMessages([]);
    setLoading(true);
    
    if (!currentUser) return;
    
    // Create a unique conversation ID
    const conversationId = [currentUser.uid, contact.id].sort().join("_");
    
    // Listen to messages
    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          senderId: data.senderId,
          receiverId: data.receiverId,
          createdAt: data.createdAt.toDate(),
          senderName: data.senderName || "Kullanıcı",
          senderAvatar: data.senderAvatar || null,
          imageUrl: data.imageUrl || null
        };
      });
      
      setMessages(messagesData);
      setLoading(false);
    });
    
    return unsubscribe;
  };

  const handleSelectContact = (contact: Contact) => {
    selectContact(contact);
    if (window.innerWidth < 768) setShowContacts(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowContacts(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedContact]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedContact || (!newMessage.trim() && !imageFile)) return;
    setSendingMessage(true);
    try {
      // Get user data
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      const conversationId = [currentUser.uid, selectedContact.id].sort().join("_");
      let imageUrl = null;
      if (imageFile) {
        const imgRef = storageRef(storage, `messages/${conversationId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imgRef, imageFile);
        imageUrl = await getDownloadURL(imgRef);
      }
      await addDoc(collection(db, "messages"), {
        conversationId,
        content: newMessage,
        imageUrl: imageUrl || null,
        senderId: currentUser.uid,
        receiverId: selectedContact.id,
        createdAt: new Date(),
        senderName: userData.displayName || "Kullanıcı",
        senderAvatar: userData.photoURL || null
      });
      // Update or create conversation
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationDoc = await getDoc(conversationRef);
      if (conversationDoc.exists()) {
        await updateDoc(conversationRef, {
          lastMessage: newMessage || "[Görsel]",
          updatedAt: new Date(),
        });
      } else {
        await setDoc(conversationRef, {
          participants: [currentUser.uid, selectedContact.id],
          lastMessage: newMessage || "[Görsel]",
          updatedAt: new Date(),
        });
      }
      setNewMessage("");
      setImageFile(null);
    } catch (error) {
      console.error("Fotoğraf yükleme hatası:", error);
      toast.error("Mesaj gönderilemedi: " + (error?.message || error));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mesajlar</h1>
        <div className="md:grid md:grid-cols-3 gap-4 flex flex-col">
          {/* Kişiler Listesi */}
          <Card className={`md:col-span-1 h-[calc(80vh-8rem)] ${!showContacts ? 'hidden md:block' : ''}`}>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Kişiler</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : contacts.length > 0 ? (
                <ScrollArea className="h-[calc(80vh-16rem)]">
                  <div className="space-y-2 pr-4">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all hover:shadow-sm ${
                          selectedContact?.id === contact.id 
                            ? "bg-primary/5 shadow-sm border border-primary/10" 
                            : "hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/5">
                          <AvatarImage src={contact.photoURL || undefined} />
                          <AvatarFallback>
                            <User className="h-6 w-6 text-primary/70" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-medium truncate">{contact.displayName}</span>
                            {contact.unread && (
                              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {contact.lastMessage || "Henüz mesaj yok"}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {contact.lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <User className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">
                    Henüz mesajlaşma geçmişi bulunmuyor
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Mesajlar Paneli */}
          <Card className={`md:col-span-2 h-[calc(80vh-8rem)] flex flex-col ${showContacts ? 'hidden md:flex' : 'flex'}`}
            style={{overflow: 'hidden'}}
          >
            <CardContent className="p-0 flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  {/* Üst Bar */}
                  <div className="flex items-center gap-3 p-4 pb-4 border-b bg-card shadow-sm sticky top-0 z-20">
                    {window.innerWidth < 768 && (
                      <Button variant="ghost" size="icon" onClick={() => setShowContacts(true)} className="mr-2 hover:bg-primary/5">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <Avatar className="h-12 w-12 border-2 border-primary/5">
                      <AvatarImage src={selectedContact.photoURL || undefined} />
                      <AvatarFallback>
                        <User className="h-6 w-6 text-primary/70" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{selectedContact.displayName}</h3>
                      <p className="text-sm text-muted-foreground">Çevrimiçi</p>
                    </div>
                  </div>

                  {/* Mesajlar Alanı */}
                  <ScrollArea className="flex-1 py-4 px-4">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : messages.length > 0 ? (
                        <>
                          {messages.map((message) => (
                            <div 
                              key={message.id}
                              className={`flex items-end gap-2 ${message.senderId === currentUser?.uid ? "flex-row-reverse" : "flex-row"}`}
                            >
                              {message.senderId !== currentUser?.uid && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={message.senderAvatar || undefined} />
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div 
                                className={`group relative max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl break-words ${
                                  message.senderId === currentUser?.uid 
                                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                                    : "bg-secondary/50 rounded-bl-sm"
                                }`}
                              >
                                {message.imageUrl && (
                                  <div className="relative mb-2 rounded-lg overflow-hidden">
                                    <img 
                                      src={message.imageUrl} 
                                      alt="gönderilen görsel" 
                                      className="max-w-full rounded-lg hover:opacity-95 transition-opacity cursor-pointer" 
                                      onClick={() => window.open(message.imageUrl, '_blank')}
                                    />
                                  </div>
                                )}
                                {message.content && <p className="leading-relaxed">{message.content}</p>}
                                <span className="absolute bottom-0 ${message.senderId === currentUser?.uid ? 'left-0' : 'right-0'} p-1.5 text-xs text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity select-none pointer-events-none">
                                  {message.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
                          <p className="text-muted-foreground text-sm">
                            Henüz mesaj bulunmuyor. İlk mesajınızı gönderin!
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Mesaj Gönderme Alanı */}
                  <div className="flex items-center gap-2 border-t p-4 bg-card sticky bottom-0 z-10">
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange} 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-full hover:bg-primary/5"
                        type="button"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </label>

                    <div className="relative flex-1">
                      {imageFile && (
                        <div className="absolute -top-12 left-0 bg-card p-2 rounded-md shadow-sm border flex items-center gap-2">
                          <span className="text-sm truncate max-w-[150px]">{imageFile.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setImageFile(null)}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Button>
                        </div>
                      )}
                      <Input
                        placeholder="Mesajınızı yazın..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="pr-12 py-6 rounded-full border-primary/10 focus-visible:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={sendingMessage || (!newMessage.trim() && !imageFile)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                        size="icon"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm text-center max-w-[240px]">
                    Mesajlaşmak için sol taraftan bir kişi seçin veya yeni bir sohbet başlatın
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
