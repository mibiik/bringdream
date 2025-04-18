import { useEffect, useState, useRef } from "react";
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
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, increment } from "firebase/firestore"; // serverTimestamp, updateDoc, increment eklendi
import { useAuth } from "@/components/auth-provider";
import { toast } from "@/components/ui/sonner";
// import { DreamInterpretation } from "@/components/dream-interpretation"; // Kullanılmıyorsa kaldırıldı
import { AIComment } from "@/components/ai-comment";


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
  comments: number; // Bu state güncellenmeyebilir, yorum sayısı 'comments' state'inden alınabilir
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
}

// Tarih formatlama fonksiyonu (Component dışında tanımlanabilir)
const formatDate = (timestamp: any) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return "Bilinmeyen tarih";
  }
  try {
    return new Date(timestamp.toDate()).toLocaleDateString("tr-TR", {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return "Geçersiz tarih";
  }
};


const DreamDetail = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { dreamId } = useParams<{ dreamId: string }>();
  const navigate = useNavigate();

  const [dream, setDream] = useState<Dream | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shared, setShared] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const fetchDreamAndComments = async () => {
    if (!dreamId) {
      toast.error("Geçersiz rüya kimliği.", { position: 'top-center' });
      navigate('/');
      return Promise.resolve(null); // Promise döndürerek unsubscribe hatasını önle
    }
    setLoading(true);

    try {
      const dreamDocRef = doc(db, "dreams", dreamId);
      const dreamDoc = await getDoc(dreamDocRef);

      if (dreamDoc.exists()) {
        const dreamData = dreamDoc.data();

        if (dreamData.isPrivate && dreamData.userId !== currentUser?.uid) {
          toast.error("Bu rüya özel olarak ayarlanmış veya bulunamadı.", { position: 'top-center' });
          setLoading(false);
          setDream(null);
          return Promise.resolve(null); // Promise döndür
        }

        const fetchedDream: Dream = {
          id: dreamDoc.id,
          title: dreamData.title,
          content: dreamData.content,
          createdAt: formatDate(dreamData.createdAt),
          isPrivate: dreamData.isPrivate,
          userId: dreamData.userId,
          userName: dreamData.userName,
          userAvatar: dreamData.userAvatar || null,
          userUsername: dreamData.userUsername || undefined,
          likes: dreamData.likes || 0,
          comments: dreamData.comments || 0 // Firestore'dan gelen ilk yorum sayısı
        };
        setDream(fetchedDream);
        setLikeCount(fetchedDream.likes);
        // TODO: Kullanıcının beğeni durumunu Firestore'dan kontrol et

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
              createdAt: formatDate(data.createdAt),
              userId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar || null
            };
          });
          setComments(commentsData);
        }, (error) => {
          console.error("Yorumları dinlerken hata:", error);
          toast.error("Yorumlar yüklenirken bir hata oluştu.", { position: 'top-center' });
        });

        setLoading(false); // Yorum listener'ı kurulduktan sonra loading'i kapat
        return unsubscribe; // Cleanup fonksiyonunu döndür

      } else {
        toast.error("Rüya bulunamadı.", { position: 'top-center' });
        setDream(null);
        setLoading(false);
        return Promise.resolve(null); // Promise döndür
      }
    } catch (error) {
      console.error("Rüya veya yorum çekme hatası:", error);
      toast.error("Rüya yüklenirken bir hata oluştu.", { position: 'top-center' });
      setDream(null);
      setLoading(false);
      return Promise.resolve(null); // Promise döndür
    }
    // finally bloğu kaldırıldı, loading state'i try/catch içinde yönetiliyor.
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchData = async () => {
      const result = await fetchDreamAndComments();
      if (typeof result === 'function') {
        unsubscribe = result;
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dreamId, currentUser?.uid]); // Bağımlılıklar doğru

  const handleLike = async () => {
     if (!currentUser || !dreamId) {
        toast.error("Beğenmek için giriş yapmalısınız.", { position: 'top-center'});
        return;
    }
    // Optimistic UI update
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount((c) => newLikedState ? c + 1 : c - 1);

    try {
        // TODO: Implement Firestore update logic for likes
        // Example: updateDoc(doc(db, 'dreams', dreamId), { likes: increment(newLikedState ? 1 : -1) });
        //         Update user's liked dreams list
        console.log("Like/Unlike action to be implemented in Firestore");
        // toast.info(newLikedState ? "Rüya beğenildi." : "Beğeni geri alındı.", { position: 'top-center', duration: 1500 });
    } catch (error) {
        console.error("Beğenme hatası:", error);
        toast.error("Beğenme işlemi sırasında bir hata oluştu.", { position: 'top-center' });
        // Rollback UI on error
        setLiked(!newLikedState);
        setLikeCount((c) => !newLikedState ? c + 1 : c - 1);
    }
  };

  const handleComment = () => {
    setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const textarea = document.querySelector<HTMLTextAreaElement>('#new-comment-textarea'); // ID ekledim
      textarea?.focus();
    }, 100);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShared(true);
        toast.success("Rüya bağlantısı panoya kopyalandı!", { position: 'top-center', duration: 2000 });
        setTimeout(() => setShared(false), 2000);
      })
      .catch(err => {
        console.error('Panoya kopyalanamadı: ', err);
        toast.error("Bağlantı kopyalanamadı.", { position: 'top-center' });
      });
  };


  const handleAddComment = async () => {
    if (!currentUser || !dreamId || !newComment.trim()) return;

    setSubmitting(true);
    const commentText = newComment; // State değişmeden önce yakala
    setNewComment(""); // Optimistic clear

    try {
      // Kullanıcı adını ve avatarını auth'tan veya state'ten al (fetch yerine)
      const userName = currentUser.displayName || "Anonim Kullanıcı";
      const userAvatar = currentUser.photoURL || null;

      await addDoc(collection(db, "comments"), {
        dreamId,
        text: commentText,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: userName,
        userAvatar: userAvatar
      });

      // Rüya dökümanındaki yorum sayısını artır (Cloud Function daha iyi olur)
      try {
        await updateDoc(doc(db, "dreams", dreamId), {
          comments: increment(1)
        });
      } catch (updateError) {
          console.error("Yorum sayısı güncellenemedi:", updateError);
          // Yorum eklendiği için devam et, sadece logla
      }

      // setNewComment(""); // Zaten yukarıda yapıldı
      toast.success("Yorumunuz eklendi.", { position: 'top-center' });
    } catch (error) {
      console.error("Yorum ekleme hatası:", error);
      toast.error("Yorum eklenirken bir hata oluştu.", { position: 'top-center' });
      setNewComment(commentText); // Hata durumunda textarea'yı geri doldur
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!dream) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 px-4">
          <p className="text-lg text-muted-foreground">Rüya bulunamadı veya bu içeriğe erişim izniniz yok.</p>
          <Button onClick={() => navigate('/')} className="mt-4">Ana Sayfaya Dön</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Yorumları filtrele (AI olmayanlar)
  const userComments = comments.filter(c => c.userId !== 'ai');

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4 py-6">
        {/* Rüya Detay Kartı */}
        <Card className="overflow-hidden border border-border/50 bg-background/95 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-6">
             {/* ... (CardHeader içeriği önceki kodla aynı, kontrol edildi) ... */}
             <div className="flex items-center gap-3 mb-4">
              <a href={`/profile/${dream.userUsername || dream.userId}`} className="cursor-pointer flex-shrink-0">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={dream.userAvatar || undefined} alt={dream.userName} />
                    <AvatarFallback>{dream.userName ? dream.userName.slice(0, 2).toUpperCase() : '??'}</AvatarFallback>
                  </Avatar>
              </a>
              <div className="flex flex-col flex-grow min-w-0"> {/* min-w-0 taşmayı önler */}
                <span className="text-sm font-medium truncate"> {/* truncate uzun isimlerde taşmayı önler */}
                  <a
                    href={`/profile/${dream.userUsername || dream.userId}`}
                    className="text-foreground hover:underline cursor-pointer font-semibold"
                  >
                    {dream.userName}
                  </a>
                  {dream.userUsername && (
                    <a
                      href={`/profile/${dream.userUsername}`}
                      className="text-sm text-muted-foreground hover:underline ml-1 cursor-pointer"
                    >
                      @{dream.userUsername}
                    </a>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{dream.createdAt}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0"> {/* Düzenleme/Silme Butonları */}
                  {dream.isPrivate && (
                    <Lock className="h-4 w-4 text-muted-foreground" title="Özel Rüya"/>
                  )}
                 {currentUser && dream.userId === currentUser.uid && (
                   <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Rüyayı Düzenle"
                      onClick={() => navigate(`/editdream/${dream.id}`)}
                    >
                     {/* Pencil Icon SVG */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Rüyayı Sil"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <DeleteDreamDialog
                      open={deleteDialogOpen}
                      onClose={() => setDeleteDialogOpen(false)}
                      onConfirm={async () => {
                        setDeleteDialogOpen(false);
                        // currentUser null kontrolü eklendi
                        const success = currentUser ? await safeDeleteDream(dream.id, currentUser.uid) : false;
                        if (success) {
                          toast.success("Rüya başarıyla silindi.", { position: 'top-center' });
                          navigate("/dashboard");
                        } else if (currentUser){ // Sadece giriş yapmışsa ve silme başarısızsa hata göster
                           toast.error("Rüya silinirken bir hata oluştu veya yetkiniz yok.", { position: 'top-center' });
                        }
                      }}
                      minimal
                    />
                   </>
                  )}
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2 break-words">{dream.title}</h1>
          </CardHeader>
          <CardContent className="p-6 pt-2">
             {/* ... (CardContent içeriği önceki kodla aynı) ... */}
            <p className="text-base whitespace-pre-line text-foreground/90 break-words">{dream.content}</p>
          </CardContent>
          <CardFooter className="p-6 pt-4 flex items-center justify-between border-t border-border/30 mt-4">
             {/* ... (CardFooter içeriği önceki kodla aynı, like/comment/share butonları) ... */}
             <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 group" onClick={handleLike} aria-pressed={liked}>
                <Heart className={`h-4 w-4 transition-colors duration-200 ${liked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground group-hover:text-red-500"}`} />
                <span className={`text-xs font-medium transition-colors duration-200 ${liked ? "text-red-500" : "text-muted-foreground group-hover:text-red-500"}`}>{likeCount}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 group" onClick={handleComment}>
                <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                 {/* Yorum sayısını userComments.length'ten al */}
                <span className="text-xs text-muted-foreground group-hover:text-primary">{userComments.length}</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 group" onClick={handleShare}>
                 <Share2 className={`h-4 w-4 transition-transform duration-200 ${shared ? "text-blue-500 scale-110" : "text-muted-foreground group-hover:text-blue-500"}`} />
                <span className={`text-xs font-medium transition-colors duration-200 ${shared ? "text-blue-500" : "text-muted-foreground group-hover:text-blue-500"}`}>{shared ? "Kopyalandı!" : "Paylaş"}</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* AI Yorum Alanı */}
        <div className="mt-6">
          <AIComment
            dreamId={dream.id}
            dreamContent={dream.content}
            onNewAIComment={() => { console.log("Yeni AI yorumu geldi (state güncellemesi AIComment içinde olabilir)"); }}
          />
        </div>

        {/* Yorumlar Bölümü */}
        <div className="space-y-6 mt-8" ref={commentsRef}>
           {/* Yorum başlığını userComments sayısına göre göster */}
          <h2 className="text-xl font-semibold">Yorumlar ({userComments.length})</h2>

          {/* Kullanıcı Yorum Ekleme Alanı */}
          {currentUser ? (
            <div className="flex gap-3 items-start">
              <Avatar className="h-10 w-10 mt-1 flex-shrink-0 border">
                 <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "Kullanıcı"}/>
                 <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  id="new-comment-textarea" // HandleComment'da focus için ID eklendi
                  placeholder="Rüya hakkında bir yorum yazın..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor
                    </>
                  ) : (
                    "Yorum Yap"
                  )}
                </Button>
              </div>
            </div>
          ) : ( // Giriş yapılmamışsa mesaj göster
            <p className="text-sm text-muted-foreground text-center py-4">Yorum yapmak için <a href="/login" className="text-primary hover:underline font-medium">giriş yapın</a>.</p>
          )}

          {/* ----- YORUM LİSTESİ (HATA ALINAN BÖLGE) ----- */}
          <div className="space-y-4 pt-4 border-t border-border/30">
            {userComments.length > 0 ? (
              userComments.map((comment) => (
                // Her yorum için Card elemanı
                <Card key={comment.id} className="bg-background border border-border/30 shadow-sm"> {/* Veya bg-muted/30 */}
                  <CardContent className="p-4">
                    {/* Flex container for avatar and content */}
                    <div className="flex gap-3 items-start">
                      {/* Avatar - Bu bölge hata mesajında belirtiliyordu */}
                      <Avatar className="h-8 w-8 flex-shrink-0 border">
                        <AvatarImage src={comment.userAvatar || undefined} alt={comment.userName ? `${comment.userName} avatarı` : 'Kullanıcı avatarı'}/>
                        <AvatarFallback>{comment.userName ? comment.userName.slice(0, 2).toUpperCase() : '??'}</AvatarFallback>
                      </Avatar>
                       {/* /Avatar kapanışı */}

                      {/* Comment Content */}
                      <div className="flex-1 min-w-0"> {/* min-w-0 taşmayı önler */}
                        <div className="flex justify-between items-center mb-1 gap-2">
                          {/* Kullanıcı Adı (Link olabilir) */}
                          <span className="text-sm font-medium text-foreground truncate">
                             <a href={`/profile/${comment.userId}`} className="hover:underline">{comment.userName || 'Kullanıcı'}</a>
                          </span>
                           {/* Yorum Tarihi */}
                          <span className="text-xs text-muted-foreground flex-shrink-0">{comment.createdAt}</span>
                        </div>
                         {/* Yorum Metni */}
                        <p className="text-sm text-foreground/90 whitespace-pre-line break-words">{comment.text}</p>
                      </div>
                       {/* /Comment Content div kapanışı */}
                    </div>
                    {/* /Flex container div kapanışı */}
                  </CardContent>
                   {/* /CardContent kapanışı */}
                </Card>
                 // /Card kapanışı
              )) // .map fonksiyonu parantezi
            ) : (
              // Yorum yoksa gösterilecek mesaj (loading bittiyse)
              !loading && (
                <p className="text-center text-muted-foreground py-6">
                  Henüz yorum yapılmamış. İlk yorumu sen yap!
                </p>
              )
            )} {/* Ternary operatörün kapanış parantezi */}
          </div>
           {/* /Yorum listesi div kapanışı */}
        </div>
        {/* /Yorumlar bölümü div kapanışı */}
      </div>
       {/* /Ana container div kapanışı */}
    </DashboardLayout>
     // /DashboardLayout kapanışı
  );
};

export default DreamDetail;