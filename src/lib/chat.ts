import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// Kullanıcı ile olan mevcut sohbeti bul veya yeni sohbet oluştur
export async function findOrCreateChat(currentUserId: string, otherUserId: string) {
  try {
    // Önce mevcut sohbeti ara
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUserId)
    );

    const querySnapshot = await getDocs(q);
    const existingChat = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(otherUserId);
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Diğer kullanıcının bilgilerini al
    const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
    const otherUserData = otherUserDoc.data();

    // Mevcut kullanıcının bilgilerini al
    const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
    const currentUserData = currentUserDoc.data();

    // Yeni sohbet oluştur
    const newChatRef = await addDoc(chatsRef, {
      participants: [currentUserId, otherUserId],
      createdAt: serverTimestamp(),
      lastMessage: null,
      userDetails: {
        [currentUserId]: {
          name: currentUserData?.displayName || "Kullanıcı",
          avatar: currentUserData?.photoURL || null
        },
        [otherUserId]: {
          name: otherUserData?.displayName || "Kullanıcı",
          avatar: otherUserData?.photoURL || null
        }
      }
    });

    return newChatRef.id;
  } catch (error) {
    console.error("Sohbet oluşturma hatası:", error);
    throw new Error("Sohbet başlatılamadı");
  }
}

// Okunmamış mesaj sayısını güncelle
export async function updateUnreadCount(chatId: string, userId: string) {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCounts.${userId}`]: 0
    });
  } catch (error) {
    console.error("Okunmamış mesaj sayısı güncellenemedi:", error);
  }
}

// Yeni mesaj gönderildiğinde alıcının okunmamış mesaj sayısını artır
export async function incrementUnreadCount(chatId: string, recipientId: string) {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCounts.${recipientId}`]: arrayUnion(1)
    });
  } catch (error) {
    console.error("Okunmamış mesaj sayısı artırılamadı:", error);
  }
}