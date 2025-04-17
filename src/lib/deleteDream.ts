import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export async function safeDeleteDream(dreamId: string) {
  // Rüyayı önce bul
  const dreamRef = doc(db, "dreams", dreamId);
  const dreamSnap = await getDoc(dreamRef);
  if (!dreamSnap.exists()) throw new Error("Rüya bulunamadı.");
  const dreamData = dreamSnap.data();
  // Silinen dosyalar koleksiyonuna kopyala
  await setDoc(doc(db, "silinen-dosyalar", dreamId), {
    ...dreamData,
    deletedAt: new Date()
  });
  // Orijinalden sil
  await deleteDoc(dreamRef);
}
