import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/components/auth-provider";
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs, doc, getDoc, updateDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Send, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";

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
                <div className="space-y-2 overflow-y-auto max-h-[calc(80vh-12rem)]">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`p-2 rounded-md flex items-center gap-3 cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id ? "bg-secondary" : "hover:bg-secondary/50"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.photoURL || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">{contact.displayName}</span>
                          {contact.unread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Henüz mesajlaşma geçmişi bulunmuyor.
                </p>
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
                  {/* Mobilde geri butonu */}
                  <div className="flex items-center gap-3 p-4 pb-4 border-b">
                    {window.innerWidth < 768 && (
                      <Button variant="ghost" size="icon" onClick={() => setShowContacts(true)} className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedContact.photoURL || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{selectedContact.displayName}</span>
                  </div>
                  {/* Mesajlar alanı - tünel efekti, overflow-y-auto, sabit yükseklik */}
                  <div
                    className="flex-1 overflow-y-auto py-4 px-4 space-y-4 bg-background"
                    id="messagesScrollArea"
                    style={{
                      maxHeight: 'calc(80vh - 8rem - 90px)', // Card yüksekliği - header - input
                      minHeight: '200px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#ccc #f9f9f9',
                      overscrollBehavior: 'contain',
                      borderRadius: '0 0 1.5rem 1.5rem',
                    }}
                  >
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : messages.length > 0 ? (
                      <>
                        {messages.map((message) => (
                          <div 
                            key={message.id}
                            className={`flex ${message.senderId === currentUser?.uid ? "justify-end" : "justify-start"}`}
                          >
                            <div 
                              className={`max-w-[85vw] md:max-w-[70%] px-4 py-2 rounded-lg break-words shadow-sm ${
                                message.senderId === currentUser?.uid 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}
                            >
                              {message.imageUrl && (
                                <img src={message.imageUrl} alt="gönderilen görsel" className="rounded-lg max-w-full max-h-60 mt-2" />
                              )}
                              {message.content && <p>{message.content}</p>}
                              <p className="text-xs opacity-70 mt-1">
                                {message.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        Henüz mesaj bulunmuyor. İlk mesajınızı gönderin!
                      </p>
                    )}
                  </div>
                  {/* Mesaj input alanı - sticky bottom, CardContent padding kaldırıldı */}
                  <div className="flex gap-2 border-t p-4 bg-background sticky bottom-0 z-10">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      <span className="inline-block p-2 bg-muted rounded-full hover:bg-secondary transition">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </span>
                    </label>
                    <Input
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 text-base py-3 px-4 rounded-full"
                      style={{fontSize: '1rem'}}
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
                      className="rounded-full h-12 w-12 flex items-center justify-center"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Mesajlaşmak için sol taraftan bir kişi seçin.
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
