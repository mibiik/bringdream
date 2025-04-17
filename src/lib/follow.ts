import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Takip et
export async function followUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) throw new Error("Kendini takip edemezsin");
  // Önce dokümanlar var mı kontrol et, yoksa oluştur
  const targetRef = doc(db, "users", targetUserId);
  const currentRef = doc(db, "users", currentUserId);
  const targetSnap = await getDoc(targetRef);
  const currentSnap = await getDoc(currentRef);
  if (!targetSnap.exists()) await setDoc(targetRef, { followers: [], followerCount: 0, following: [], followingCount: 0, createdAt: new Date() });
  if (!currentSnap.exists()) await setDoc(currentRef, { followers: [], followerCount: 0, following: [], followingCount: 0, createdAt: new Date() });
  // Takip edilenin takipçi listesine ekle
  await updateDoc(targetRef, {
    followers: arrayUnion(currentUserId),
    followerCount: increment(1)
  });
  // Takip edenin following listesine ekle
  await updateDoc(currentRef, {
    following: arrayUnion(targetUserId),
    followingCount: increment(1)
  });
}

// Takipten çık
export async function unfollowUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) throw new Error("Kendini takipten çıkaramazsın");
  const targetRef = doc(db, "users", targetUserId);
  const currentRef = doc(db, "users", currentUserId);
  const targetSnap = await getDoc(targetRef);
  const currentSnap = await getDoc(currentRef);
  if (!targetSnap.exists()) await setDoc(targetRef, { followers: [], followerCount: 0, following: [], followingCount: 0, createdAt: new Date() });
  if (!currentSnap.exists()) await setDoc(currentRef, { followers: [], followerCount: 0, following: [], followingCount: 0, createdAt: new Date() });
  await updateDoc(targetRef, {
    followers: arrayRemove(currentUserId),
    followerCount: increment(-1)
  });
  await updateDoc(currentRef, {
    following: arrayRemove(targetUserId),
    followingCount: increment(-1)
  });
}

// Takip ediyor mu?
export async function isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (!currentUserId || !targetUserId) return false;
  const docSnap = await getDoc(doc(db, "users", currentUserId));
  const data = docSnap.data();
  return Array.isArray(data?.following) && data.following.includes(targetUserId);
}
