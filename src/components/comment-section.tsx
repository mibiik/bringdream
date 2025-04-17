import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
}

interface CommentSectionProps {
  dreamId: string;
}

export function CommentSection({ dreamId }: CommentSectionProps) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dreamId) return;
    setLoading(true);
    const commentsQuery = query(
      collection(db, "comments"),
      where("dreamId", "==", dreamId),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString("tr-TR") : "",
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar || null,
        };
      });
      setComments(commentsData);
      setLoading(false);
    });
    return unsubscribe;
  }, [dreamId]);

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "comments"), {
        dreamId,
        text: newComment,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || "Kullanıcı",
        userAvatar: currentUser.photoURL || null,
      });
      setNewComment("");
    } catch (error) {
      alert("Yorum eklenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-2 font-semibold text-sm text-gray-700 flex items-center gap-1">
        <span>Yorumlar</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">{comments.length}</span>
      </div>
      {loading ? (
        <div className="text-xs text-gray-400">Yükleniyor...</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-gray-400">Henüz yorum yok.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar className="h-7 w-7 border">
                <AvatarImage src={c.userAvatar || undefined} alt={c.userName} />
                <AvatarFallback>{c.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xs font-semibold">{c.userName}</div>
                <div className="text-xs text-gray-600">{c.text}</div>
                <div className="text-[10px] text-gray-400">{c.createdAt}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        className="flex gap-2 mt-4"
        onSubmit={e => {
          e.preventDefault();
          handleAddComment();
        }}
      >
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          className="border px-2 py-1 rounded text-xs flex-1"
          placeholder="Yorumunuzu yazın..."
          disabled={submitting}
        />
        <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
          Gönder
        </Button>
      </form>
    </div>
  );
}
