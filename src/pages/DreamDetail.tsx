import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { DeleteDreamDialog } from "@/components/DeleteDreamDialog";
import { safeDeleteDream } from "@/lib/deleteDream";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, Lock, User, Share2, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { toast } from "@/components/ui/sonner";
import { DreamInterpretation } from "@/components/dream-interpretation";
import { AIComment } from "@/components/ai-comment";
import { useRef } from "react";

interface Dream {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isPrivate: boolean;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userUsername?: string;
  likes: number;
  comments: number;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
}

const DreamDetail = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const shouldShowDialog = () => localStorage.getItem("hideDeleteDreamDialog") !== "1";
  const { dreamId } = useParams<{ dreamId: string }>();
  const navigate = useNavigate();
  
  // URL'den rüya kimliğini kontrol et
  useEffect(() => {
    if (!dreamId) {
      toast.error("Geçersiz rüya kimliği.", { position: 'top-center' });
      navigate('/');
      return;
    }

    // Geçerli bir rüya kimliği varsa veriyi çek
    fetchDreamAndComments();
  }, [dreamId, navigate]);
  const [dream, setDream] = useState<Dream | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(dream?.likes || 0);
  const [shared, setShared] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    // TODO: Backend ile entegre etmek için buraya API çağrısı eklenebilir
  };

  const handleComment = () => {
    setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const fetchDreamAndComments = async () => {
      if (!dreamId) return;

      try {
        const dreamDocRef = doc(db, "dreams", dreamId);
        const dreamDoc = await getDoc(dreamDocRef);

        if (dreamDoc.exists()) {
          const dreamData = dreamDoc.data();
          
          // Check if the dream is private and user is not the owner
          if (dreamData.isPrivate && dreamData.userId !== currentUser?.uid) {
            toast.error("Bu rüya özel olarak ayarlanmış.", { position: 'top-center' });
            setLoading(false);
            return;
          }
          
          setDream({
            id: dreamDoc.id,
            title: dreamData.title,
            content: dreamData.content,
            createdAt: new Date(dreamData.createdAt.toDate()).toLocaleDateString("tr-TR"),
            isPrivate: dreamData.isPrivate,
            userId: dreamData.userId,
            userName: dreamData.userName,
            userAvatar: dreamData.userAvatar,
            userUsername: dreamData.userUsername || null,
            likes: dreamData.likes || 0,
            comments: dreamData.comments || 0
          });
          
          // Set up comments listener
          const commentsQuery = query(
            collection(db, "comments"),
            where("dreamId", "==", dreamId),
            orderBy("createdAt", "desc")
          );
          
          const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                text: data.text,
                createdAt: new Date(data.createdAt.toDate()).toLocaleDateString("tr-TR"),
                userId: data.userId,
                userName: data.userName,
                userAvatar: data.userAvatar
              };
            });
            
            setComments(commentsData);
          });
          
          return unsubscribe;
        } else {
          toast.error("Rüya bulunamadı.", { position: 'top-center' });
        }
      } catch (error) {
        console.error("Dream fetch error:", error);
        toast.error("Rüya yüklenirken bir hata oluştu.", { position: 'top-center' });
      } finally {
        setLoading(false);
      }
    };

  const handleAddComment = async () => {
    if (!currentUser || !dreamId || !newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      // Get user data
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Add comment
      await addDoc(collection(db, "comments"), {
        dreamId,
        text: newComment,
        createdAt: new Date(),
        userId: currentUser.uid,
        userName: userData.displayName || "Kullanıcı",
        userAvatar: userData.photoURL || null
      });
      
      setNewComment("");
      toast.success("Yorumunuz eklendi.", { position: 'top-center' });
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("Yorum eklenirken bir hata oluştu.", { position: 'top-center' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!dream) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p>Rüya bulunamadı veya bu içeriğe erişim izniniz yok.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card className="overflow-hidden border border-border/50 bg-background/95 backdrop-blur-sm">
          <CardHeader className="p-6">
            <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8">
  <AvatarImage src={dream.userAvatar || undefined} />
  <AvatarFallback>{dream.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
</Avatar>

              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  <a
                    href={`/profile/${dream.userUsername || dream.userId}`}
                    className="text-primary hover:underline cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  >
                    {dream.userName}
                  </a>
                  {dream.userUsername && (
                    <>
                      <span className="text-xs text-gray-500 ml-2">·</span>
                      <a
                        href={`/profile/${dream.userUsername}`}
                        className="text-xs text-blue-700 hover:underline ml-1 cursor-pointer"
                        onClick={e => e.stopPropagation()}
                      >
                        @{dream.userUsername}
                      </a>
                    </>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{dream.createdAt}</span>
              </div>
              {dream.isPrivate && (
                <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold mb-2">{dream.title}</h1>
              {currentUser && dream.userId === currentUser.uid && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Rüyayı Düzenle"
                    onClick={() => navigate(`/editdream/${dream.id}`)}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17.414 2.586a2 2 0 0 1 2.828 2.828l-12 12A2 2 0 0 1 6 18H2v-4a2 2 0 0 1 .586-1.414l12-12z"></path></svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Rüyayı Sil"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </Button>
                  <DeleteDreamDialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onConfirm={async () => {
                      setDeleteDialogOpen(false);
                      await safeDeleteDream(dream.id);
                      toast.success("Rüya silindi.", { position: 'top-center' });
                      navigate("/dashboard");
                    }}
                    minimal
                  />
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6 pt-0">
            <p className="text-base whitespace-pre-line">{dream.content}</p>
          </CardContent>
          
          <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-border/30 mt-4">
            <div className="flex items-center gap-3">
              <Button variant={liked ? "default" : "ghost"} size="sm" className="h-8 px-2 gap-1" onClick={handleLike} aria-pressed={liked}>
                <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                <span className={`text-xs font-medium ${liked ? "text-red-500" : ""}`}>{likeCount}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" onClick={handleComment}>
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{comments.length}</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className={`h-4 w-4 ${shared ? "text-blue-500 scale-110" : ""}`} />
                <span className={`text-xs font-medium ${shared ? "text-blue-500" : ""}`}>{shared ? "Bağlantı kopyalandı!" : "Paylaş"}</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* AI Yorum Butonu ve Yorum Alanı */}
        <div className="flex flex-col gap-4 mt-6">
          <AIComment 
            dreamId={dream.id}
            dreamContent={dream.content}
            onNewAIComment={() => {}}
          />
        </div>

        <div className="space-y-4 mt-6" ref={commentsRef}>
          <h2 className="text-xl font-semibold">Yorumlar ({comments.length})</h2>

          {/* Kullanıcı Yorum Ekleme Alanı */}
          {currentUser && (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Rüya hakkında bir yorum yazın..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Yorum Yap"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Yorumlar Listesi */}
          <div className="space-y-4 pt-2">
            {comments.filter(c => c.userId !== 'ai').length > 0 ? (
              comments.filter(c => c.userId !== 'ai').map((comment) => (
                <Card key={comment.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex gap-3 items-start">
                      <Avatar className="h-8 w-8">
                        <>
                          <AvatarImage src={comment.userAvatar || undefined} />
                          <AvatarFallback>{comment.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-line">{comment.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Henüz yorum yapılmamış. İlk yorumu sen yap!
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DreamDetail;

const fetchDreamAndComments = async () => {
  if (!dreamId) return;

  try {
    const dreamDocRef = doc(db, "dreams", dreamId);
    const dreamDoc = await getDoc(dreamDocRef);

    if (dreamDoc.exists()) {
      const dreamData = dreamDoc.data();

      // Check if the dream is private and user is not the owner
      if (dreamData.isPrivate && dreamData.userId !== currentUser?.uid) {
        toast.error("Bu rüya özel olarak ayarlanmış.", { position: 'top-center' });
        setLoading(false);
        return;
      }

      setDream({
        id: dreamDoc.id,
        title: dreamData.title,
        content: dreamData.content,
        createdAt: new Date(dreamData.createdAt.toDate()).toLocaleDateString("tr-TR"),
        isPrivate: dreamData.isPrivate,
        userId: dreamData.userId,
        userName: dreamData.userName,
        userAvatar: dreamData.userAvatar,
        userUsername: dreamData.userUsername || null,
        likes: dreamData.likes || 0,
        comments: dreamData.comments || 0
      });

      // Set up comments listener
      const commentsQuery = query(
        collection(db, "comments"),
        where("dreamId", "==", dreamId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text,
            createdAt: new Date(data.createdAt.toDate()).toLocaleDateString("tr-TR"),
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar
          };
        });

        setComments(commentsData);
      });

      return unsubscribe;
    } else {
      toast.error("Rüya bulunamadı.", { position: 'top-center' });
    }
  } catch (error) {
    console.error("Dream fetch error:", error);
    toast.error("Rüya yüklenirken bir hata oluştu.", { position: 'top-center' });
  } finally {
    setLoading(false);
  }
};

