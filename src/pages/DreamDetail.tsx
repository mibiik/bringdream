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
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"; // serverTimestamp eklendi
import { useAuth } from "@/components/auth-provider";
import { toast } from "@/components/ui/sonner";
// DreamInterpretation importu yorum satırı yapıldı, kullanılmıyorsa kaldırılabilir
// import { DreamInterpretation } from "@/components/dream-interpretation";
import { AIComment } from "@/components/ai-comment";


interface Dream {
  id: string;
  title: string;
  content: string;
  createdAt: string; // Veya Date türünde tutup formatlayabilirsiniz
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
  createdAt: string; // Veya Date türünde tutup formatlayabilirsiniz
  userId: string;
  userName: string;
  userAvatar: string | null;
}

const DreamDetail = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // shouldShowDialog fonksiyonu kullanılmıyor gibi görünüyor, gerekmiyorsa kaldırılabilir
  // const shouldShowDialog = () => localStorage.getItem("hideDeleteDreamDialog") !== "1";
  const { dreamId } = useParams<{ dreamId: string }>();
  const navigate = useNavigate();

  const [dream, setDream] = useState<Dream | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // showInterpretation state'i kullanılmıyor gibi, gerekmiyorsa kaldırılabilir
  // const [showInterpretation, setShowInterpretation] = useState(false);
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false); // Başlangıç değeri false olmalı
  const [likeCount, setLikeCount] = useState(0); // Başlangıç değeri 0 olmalı, dream yüklendikten sonra güncellenmeli
  const [shared, setShared] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  // Tarih formatlama fonksiyonu
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) {
      return "Bilinmeyen tarih";
    }
    return new Date(timestamp.toDate()).toLocaleDateString("tr-TR", {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchDreamAndComments = async () => {
    if (!dreamId) {
        toast.error("Geçersiz rüya kimliği.", { position: 'top-center' });
        navigate('/');
        return;
    }
    setLoading(true); // Yükleme başlangıcı

    try {
      const dreamDocRef = doc(db, "dreams", dreamId);
      const dreamDoc = await getDoc(dreamDocRef);

      if (dreamDoc.exists()) {
        const dreamData = dreamDoc.data();

        // Rüya özel mi ve kullanıcı sahip değil mi kontrolü
        if (dreamData.isPrivate && dreamData.userId !== currentUser?.uid) {
          toast.error("Bu rüya özel olarak ayarlanmış veya bulunamadı.", { position: 'top-center' });
          setLoading(false);
          setDream(null); // Rüya null olarak ayarlanmalı
          return;
        }

        const fetchedDream = {
          id: dreamDoc.id,
          title: dreamData.title,
          content: dreamData.content,
          createdAt: formatDate(dreamData.createdAt),
          isPrivate: dreamData.isPrivate,
          userId: dreamData.userId,
          userName: dreamData.userName,
          userAvatar: dreamData.userAvatar || null,
          userUsername: dreamData.userUsername || undefined, // null yerine undefined olabilir
          likes: dreamData.likes || 0,
          comments: dreamData.comments || 0
        };
        setDream(fetchedDream);
        setLikeCount(fetchedDream.likes); // Like sayısını state'e yükle
        // TODO: Kullanıcının bu rüyayı beğenip beğenmediğini Firestore'dan kontrol et ve `liked` state'ini güncelle

        // Yorumları dinlemek için listener ayarla
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
        }, (error) => { // Hata durumu için callback eklendi
          console.error("Yorumları dinlerken hata:", error);
          toast.error("Yorumlar yüklenirken bir hata oluştu.", { position: 'top-center' });
        });

        // Cleanup function for the listener
        return () => unsubscribe();

      } else {
        toast.error("Rüya bulunamadı.", { position: 'top-center' });
        setDream(null); // Rüya null olarak ayarlanmalı
      }
    } catch (error) {
      console.error("Rüya veya yorum çekme hatası:", error);
      toast.error("Rüya yüklenirken bir hata oluştu.", { position: 'top-center' });
      setDream(null); // Hata durumunda rüyayı null yap
    } finally {
      setLoading(false); // Yükleme bitişi
    }
  };

  // Rüya ve Yorumları Çekmek İçin useEffect
  useEffect(() => {
    const unsubscribe = fetchDreamAndComments();

    // Component unmount edildiğinde listener'ı temizle
    return () => {
      if (unsubscribe instanceof Promise) {
        // Eğer fetchDreamAndComments bir promise döndürdüyse (hata veya erken return durumu)
        // ve bu promise içinde bir unsubscribe fonksiyonu varsa, onu handle et
        // Bu senaryo yukarıdaki kodda pek olası değil ama genel bir önlem
        unsubscribe.then(unsubFunc => {
          if (typeof unsubFunc === 'function') {
            unsubFunc();
          }
        }).catch(() => {}); // Hata durumunda sessiz kal
      } else if (typeof unsubscribe === 'function') {
          // Eğer doğrudan bir unsubscribe fonksiyonu döndürdüyse
          unsubscribe();
      }
    };
  }, [dreamId, currentUser?.uid]); // currentUser?.uid bağımlılıklara eklendi, özel rüya kontrolü için

  const handleLike = async () => {
    if (!currentUser || !dreamId) {
        toast.error("Beğenmek için giriş yapmalısınız.", { position: 'top-center'});
        return;
    }
    // TODO: Firestore'da like işlemini gerçekleştir (beğen/beğenmekten vazgeç)
    // Örnek: Beğeni sayısını güncelle ve kullanıcının beğeni listesine ekle/çıkar
    // Bu kısım backend mantığınıza göre detaylandırılmalı

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount((c) => newLikedState ? c + 1 : c - 1);

    try {
        // Firestore'da ilgili güncellemeleri yapın
        // Örneğin: users/{userId}/likedDreams koleksiyonuna ekleme/çıkarma
        //         dreams/{dreamId} belgesindeki likes sayısını güncelleme
        // await updateLikeStatusInFirestore(dreamId, currentUser.uid, newLikedState);
        toast.info(newLikedState ? "Rüya beğenildi." : "Beğeni geri alındı.", { position: 'top-center', duration: 2000 });
    } catch (error) {
        console.error("Beğenme hatası:", error);
        toast.error("Beğenme işlemi sırasında bir hata oluştu.", { position: 'top-center' });
        // Başarısız olursa state'i geri al
        setLiked(!newLikedState);
        setLikeCount((c) => !newLikedState ? c + 1 : c - 1);
    }
  };

  const handleComment = () => {
    setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Belki yorum inputuna focuslamak daha iyi olabilir
      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Rüya hakkında bir yorum yazın..."]');
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

    try {
      // Kullanıcı verisini al (optimize edilebilir, belki Auth context'te tutuluyordur)
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      // Firestore'dan kullanıcı adını ve fotoğrafını al veya Auth context'ten al
      const userName = userDoc.exists() ? userDoc.data()?.displayName : currentUser.displayName || "Anonim Kullanıcı";
      const userAvatar = userDoc.exists() ? userDoc.data()?.photoURL : currentUser.photoURL || null;


      await addDoc(collection(db, "comments"), {
        dreamId,
        text: newComment,
        createdAt: serverTimestamp(), // Firestore server zaman damgası kullan
        userId: currentUser.uid,
        userName: userName,
        userAvatar: userAvatar
      });

      // Rüyanın yorum sayısını güncellemek için bir cloud function veya transaction kullanmak daha iyi olabilir
      // Şimdilik client-side güncelleme varsayımı:
      // const dreamDocRef = doc(db, "dreams", dreamId);
      // await updateDoc(dreamDocRef, { comments: increment(1) }); // increment import edilmeli

      setNewComment("");
      toast.success("Yorumunuz eklendi.", { position: 'top-center' });
    } catch (error) {
      console.error("Yorum ekleme hatası:", error);
      toast.error("Yorum eklenirken bir hata oluştu.", { position: 'top-center' });
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
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Rüya bulunamadı veya bu içeriğe erişim izniniz yok.</p>
          <Button onClick={() => navigate('/')} className="mt-4">Ana Sayfaya Dön</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4 py-6">
        <Card className="overflow-hidden border border-border/50 bg-background/95 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-6">
            {/* Rüya Sahibi Bilgileri */}
            <div className="flex items-center gap-3 mb-4">
              <a href={`/profile/${dream.userUsername || dream.userId}`} className="cursor-pointer">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={dream.userAvatar || undefined} alt={dream.userName} />
                    <AvatarFallback>{dream.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
              </a>
              <div className="flex flex-col flex-grow">
                <span className="text-sm font-medium">
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
              <div className="flex items-center gap-2 ml-auto">
                  {dream.isPrivate && (
                    <Lock className="h-4 w-4 text-muted-foreground" title="Özel Rüya"/>
                  )}
                  {/* Rüya Sahibi Yönetim Butonları */}
                 {currentUser && dream.userId === currentUser.uid && (
                   <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Rüyayı Düzenle"
                      onClick={() => navigate(`/editdream/${dream.id}`)}
                    >
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
                        const success = await safeDeleteDream(dream.id, currentUser.uid); // Kullanıcı kimliği eklenmeli
                        if (success) {
                          toast.success("Rüya başarıyla silindi.", { position: 'top-center' });
                          navigate("/dashboard"); // veya navigate('/')
                        } else {
                          // safeDeleteDream içinde zaten toast gösteriliyor olabilir
                          // toast.error("Rüya silinirken bir hata oluştu.", { position: 'top-center' });
                        }
                      }}
                      minimal // Bu prop varsa ve kullanılıyorsa kalsın
                    />
                   </>
                  )}
              </div>
            </div>

            {/* Rüya Başlığı */}
            <h1 className="text-2xl font-semibold mb-2 break-words">{dream.title}</h1>

          </CardHeader>

          {/* Rüya İçeriği */}
          <CardContent className="p-6 pt-2">
            <p className="text-base whitespace-pre-line text-foreground/90 break-words">{dream.content}</p>
          </CardContent>

          {/* Etkileşim Butonları */}
          <CardFooter className="p-6 pt-4 flex items-center justify-between border-t border-border/30 mt-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 group" onClick={handleLike} aria-pressed={liked}>
                <Heart className={`h-4 w-4 transition-colors duration-200 ${liked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground group-hover:text-red-500"}`} />
                <span className={`text-xs font-medium transition-colors duration-200 ${liked ? "text-red-500" : "text-muted-foreground group-hover:text-red-500"}`}>{likeCount}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 group" onClick={handleComment}>
                <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                <span className="text-xs text-muted-foreground group-hover:text-primary">{comments.length}</span>
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
              // onNewAIComment prop'u AIComment bileşeninizde tanımlıysa kullanın
              // Eğer AI yorumu geldiğinde comments state'ini güncellemek isterseniz:
              // onNewAIComment={(newAIComment) => setComments(prev => [newAIComment, ...prev])}
              onNewAIComment={() => { console.log("Yeni AI yorumu eklendi/güncellendi."); }}
            />
        </div>


        {/* Yorumlar Bölümü */}
        <div className="space-y-6 mt-8" ref={commentsRef}>
          <h2 className="text-xl font-semibold">Yorumlar ({comments.filter(c => c.userId !== 'ai').length})</h2> {/* AI yorumlarını sayma */}

          {/* Kullanıcı Yorum Ekleme Alanı */}
          {currentUser && (
            <div className="flex gap-3 items-start">
              <Avatar className="h-10 w-10 mt-1 flex-shrink-0 border">
                 {/* Auth context'ten veya Firestore'dan alınan avatar */}
                 <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "Kullanıcı"}/>
                 <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
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
          )}
           {!currentUser && (
                <p className="text-sm text-muted-foreground text-center py-4">Yorum yapmak için <a href="/login" className="text-primary hover:underline">giriş yapın</a>.</p>
           )}

          {/* Yorumlar Listesi */}
          <div className="space-y-4 pt-4 border-t border-border/30">
             {/* Sadece kullanıcı yorumlarını filtrele */}
            {comments.filter(c => c.userId !== 'ai').length > 0 ? (
              comments.filter(c => c.userId !== 'ai').map((comment) => (
                <Card key={comment.id} className="bg-muted/30 border-none shadow-none">
                  <CardContent className="p-4">
                    <div className="flex gap-3 items-start">
                      {/* ------ HATA BURADAYDI ------- */}
                      {/* Fragment (<> </>) kaldırıldı */}
                      <Avatar className="h-8 w-8 flex-shrink-0 border">
                        <AvatarImage src={comment.userAvatar || undefined} alt={comment.userName}/>
                        <AvatarFallback>{comment.userName ? comment.userName.slice(0, 2).toUpperCase() : '??'}</AvatarFallback>
                      </Avatar>
                      {/* ------ DÜZELTİLDİ ------- */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <a href={`/profile/${comment.userId}`} className="text-sm font-medium text-foreground hover:underline">{comment.userName || 'Kullanıcı'}</a>
                          <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-line break-words">{comment.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
                !loading && ( // Sadece yükleme bittiğinde "yorum yok" mesajını göster
                    <p className="text-center text-muted-foreground py-6">
                      Henüz yorum yapılmamış. İlk yorumu sen yap!
                    </p>
                )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DreamDetail;