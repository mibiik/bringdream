import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DreamCard } from "@/components/dream-card";
import { collection, query, orderBy, getDocs, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, User, TrendingUp, Hash, RefreshCw, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { DeleteDreamDialog } from "@/components/DeleteDreamDialog";
import { safeDeleteDream } from "@/lib/deleteDream";
import { useAuth } from "@/components/auth-provider";

interface Dream {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isPrivate: boolean;
  likes: number;
  comments: any[];
  reposts: number;
  user: {
    name: string;
    avatar: string;
  };
}

interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  photoURL: string | null;
}

const Discover = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"dreams" | "users">("dreams");
  const [selectedTag, setSelectedTag] = useState<string|null>(null);
  const [showPopular, setShowPopular] = useState(false);

  useEffect(() => {
    const fetchPublicDreams = async () => {
      try {
        const dreamsQuery = query(
          collection(db, "dreams"),
          where("isPrivate", "==", false),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        
        const snapshot = await getDocs(dreamsQuery);
        const dreamsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            createdAt: new Date(data.createdAt.toDate()).toLocaleDateString("tr-TR"),
            isPrivate: data.isPrivate,
            likes: data.likes || 0,
            comments: Array.isArray(data.comments) ? data.comments : [],
            reposts: data.reposts || 0,
            user: {
              id: data.userId || "",
              name: data.userName || "Kullanıcı",
              avatar: data.userAvatar || "",
            }
          };
        });
        
        setDreams(dreamsList);
      } catch (error) {
        console.error("Dreams fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDreams();
  }, []);

  // Türkçe karakterleri normalize eden yardımcı fonksiyon
  function normalizeText(str: string) {
    return str
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "g");
  }

  const searchUsers = async (input?: string) => {
    const term = typeof input === "string" ? input : searchTerm;
    if (!term.trim()) {
      setUsers([]);
      return;
    }
    setSearching(true);
    try {
      // Tüm kullanıcıları çek (daha küçük uygulamalarda yeterli, büyük veri setinde pagination gerekir)
      const usersCol = collection(db, "users");
      const snapshot = await getDocs(usersCol);
      const usersList: UserProfile[] = snapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName || "Kullanıcı",
        username: doc.data().username || "",
        photoURL: doc.data().photoURL || null
      }));
      const normSearch = normalizeText(term);
      const filteredUsers = usersList.filter(
        u =>
          normalizeText(u.displayName || "").includes(normSearch) ||
          normalizeText(u.username || "").includes(normSearch)
      );
      setUsers(filteredUsers);
      setActiveTab("users");
    } catch (error) {
      console.error("Users search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const searchDreams = () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    
    try {
      // Client-side filtering for dreams
      const filtered = dreams.filter(dream => 
        dream.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dream.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setDreams(filtered);
      setActiveTab("dreams");
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === "users") {
      searchUsers();
    } else {
      searchDreams();
    }
  };

  function parseHashtags(text: string): string[] {
    return (text.match(/#(\w+)/g) || []).map(tag => tag.replace('#',''));
  }

  function Flood({ dream }: { dream: Dream }) {
    // Flood: Nokta, ünlem, soru işaretiyle ayrılan cümleleri alt alta göster
    const sentences = dream.content.split(/(?<=[.!?])\s+/).filter(Boolean);
    return (
      <div className="flex flex-col gap-0.5">
        {sentences.map((sentence, i) => (
          <div key={i} className="text-base leading-relaxed py-1 px-2 hover:bg-blue-50 rounded transition cursor-pointer">
            {sentence}
          </div>
        ))}
      </div>
    );
  }

  function HashtagBar({ hashtags, onTag }: { hashtags: string[], onTag: (tag: string) => void }) {
    if (!hashtags.length) return null;
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {hashtags.map(tag => (
          <Badge key={tag} className="cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => onTag(tag)}>
            #{tag}
          </Badge>
        ))}
      </div>
    );
  }

  function HashtagExplore({ allTags, selectedTag, onTag }: { allTags: string[], selectedTag: string|null, onTag: (tag: string|null) => void }) {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          key="all"
          className={`cursor-pointer ${selectedTag===null ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => onTag(null)}
        >
          #Tümü
        </Badge>
        {allTags.map(tag => (
          <Badge
            key={tag}
            className={`cursor-pointer ${selectedTag===tag ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}
            onClick={() => onTag(tag)}
          >
            #{tag}
          </Badge>
        ))}
      </div>
    );
  }

  function RepostInfo({ reposts, likes }: { reposts: number, likes: number }) {
    return (
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-muted-foreground">{reposts || 0} kez paylaşıldı</span>
        {likes > 10 && <span className="text-xs font-bold text-primary">🔥 Popüler Rüya</span>}
      </div>
    );
  }

  function getTotalCommentCount(comments: any[]): number {
    if (!comments) return 0;
    let count = comments.length;
    for (const c of comments) {
      if (Array.isArray(c.replies)) {
        count += getTotalCommentCount(c.replies);
      }
    }
    return count;
  }

  function ActionBar({ dream, onLike, onComment, onRepost, liked, likeCount, comments, reposted, commentCount }: {
    dream: Dream,
    onLike: () => void,
    onComment: () => void,
    onRepost: () => void,
    liked: boolean,
    likeCount: number,
    comments: any[],
    reposted: boolean,
    commentCount: number
  }) {
    // Paylaş butonuna tıklanınca linki kopyala
    const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      const link = `${window.location.origin}/dream/${dream.id}`;
      navigator.clipboard.writeText(link);
      onRepost();
    };

    return (
      <div className="flex gap-4 items-center mt-2 select-none">
        <button className="flex items-center gap-1 group" onClick={onLike} aria-pressed={liked}>
          <Heart className={`h-5 w-5 transition ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground group-hover:text-red-400'}`} />
          <span className={`text-xs font-medium ${liked ? 'text-red-500' : 'text-muted-foreground group-hover:text-red-400'}`}>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1 group" onClick={onComment}>
          <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition" />
          {commentCount > 0 ? (
            <span className="text-xs font-medium text-blue-500 group-hover:text-blue-700">{commentCount}</span>
          ) : (
            <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-500">Yorum yok</span>
          )}
        </button>
        <button className="flex items-center gap-1 group" onClick={handleShare} aria-pressed={reposted} title="Bağlantıyı kopyala">
          <Share2 className={`h-5 w-5 transition ${reposted ? 'text-blue-500 scale-110' : 'text-muted-foreground group-hover:text-blue-400'}`} />
          <span className={`text-xs font-medium ${reposted ? 'text-blue-500' : 'text-muted-foreground group-hover:text-blue-400'}`}>{reposted ? 'Kopyalandı!' : 'Paylaş'}</span>
        </button>
      </div>
    );
  }

  // Yorumlar bileşeni
  function CommentsSection({ comments, onReply }: { comments: any[], onReply: (commentId: string, text: string) => void }) {
    const [replyingTo, setReplyingTo] = useState<string|null>(null);
    const [replyText, setReplyText] = useState("");
    return (
      <div className="mt-3 border-t pt-3">
        {comments.map((c: any) => (
          <div key={c.id} className="mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border">
                <AvatarImage src={c.user.avatar} alt={c.user.name} />
                <AvatarFallback>{c.user.name.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold">{c.user.name}</span>
              <span className="text-xs text-muted-foreground">{c.createdAt}</span>
            </div>
            <div className="ml-8 text-sm py-1">{c.text}</div>
            <button className="ml-8 text-xs text-blue-600 hover:underline" onClick={() => setReplyingTo(c.id)}>Yanıtla</button>
            {/* Yanıt formu */}
            {replyingTo === c.id && (
              <form className="flex gap-2 ml-8 mt-1" onSubmit={e => { e.preventDefault(); onReply(c.id, replyText); setReplyText(""); setReplyingTo(null); }}>
                <input value={replyText} onChange={e => setReplyText(e.target.value)} className="border rounded px-2 py-1 text-xs flex-1" placeholder="Yanıt yaz..." />
                <button type="submit" className="text-xs text-white bg-blue-600 px-2 py-1 rounded">Gönder</button>
              </form>
            )}
            {/* Yanıtlar */}
            {c.replies && c.replies.length > 0 && (
              <div className="ml-12 mt-1 border-l pl-2">
                {c.replies.map((r: any) => (
                  <div key={r.id} className="mb-1">
                    <span className="text-xs font-semibold">{r.user.name}</span>: <span className="text-xs">{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Kart bazlı local state için özel bir bileşen
  function DreamFeedCard({ dream, externalCommentCount, onDelete }: { dream: Dream, externalCommentCount?: number, onDelete?: (id: string) => void }) {
    const initialComments = Array.isArray(dream.comments) ? dream.comments : [];
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(dream.likes || 0);
    const [reposted, setReposted] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>(initialComments);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { currentUser } = useAuth();

    const handleLike = () => {
      setLiked(l => !l);
      setLikeCount(c => liked ? c - 1 : c + 1);
    };
    const handleRepost = () => {
      setReposted(true);
      setTimeout(() => setReposted(false), 2000);
    };
    const handleComment = () => setShowComments(v => !v);

    // Yorumlara yanıt verme
    const handleReply = (commentId: string, text: string) => {
      setComments(comments => comments.map(c => c.id === commentId ? {
        ...c,
        replies: [...(c.replies || []), { id: Date.now().toString(), user: { name: "Sen", avatar: "" }, text }]
      } : c));
    };

    // Kartın tamamına tıklanınca detay sayfasına git
    const handleCardClick = (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest('button, a, input, form')) {
        window.location.href = `/dream/${dream.id}`;
      }
    };

    // Discover'dan gelen gerçek yorum sayısı (externalCommentCount) varsa onu kullan, yoksa local hesaplananı kullan
    const totalComments = typeof externalCommentCount === 'number' ? externalCommentCount : getTotalCommentCount(comments);

    // Silme popup'ını göster
    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteDialogOpen(true);
    };
    // Silme işlemini uygula
    const handleConfirmDelete = async (dontShowAgain: boolean) => {
      setDeleteDialogOpen(false);
      if (dontShowAgain) localStorage.setItem("hideDeleteDreamDialog", "1");
      await safeDeleteDream(dream.id);
      if (onDelete) onDelete(dream.id);
    };

    return (
      <div onClick={handleCardClick} className="relative group border rounded-xl bg-white/80 shadow-md hover:shadow-lg transition-all p-5 flex flex-col gap-2 cursor-pointer">
        {/* KULLANICI BİLGİSİ */}
        <div className="flex items-center gap-3 mb-2">
          <Link to={`/profile/${dream.user.id}`}> 
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={dream.user.avatar} alt={dream.user.name} />
              <AvatarFallback>{dream.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{dream.user.name}</span>
            <span className="text-xs text-muted-foreground">{dream.createdAt}</span>
          </div>
          {/* Sadece kendi rüyan ise sil butonu göster */}
          {dream.user.id === currentUser?.uid && (
            <button onClick={handleDeleteClick} className="ml-auto p-1 rounded hover:bg-red-100" title="Rüyayı Sil">
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          )}
        </div>
        {/* FLOOD (ALT ALTA CÜMLELER) */}
        <Flood dream={dream} />
        {/* HASHTAGLER */}
        <HashtagBar hashtags={parseHashtags(dream.content + ' ' + dream.title)} onTag={setSelectedTag} />
        {/* PAYLAŞIM/POPÜLERLİK */}
        <RepostInfo reposts={dream.reposts || 0} likes={dream.likes} />
        {/* ACTION BAR (BEĞENİ, YORUM, PAYLAŞ) */}
        <ActionBar dream={dream} onLike={handleLike} onComment={handleComment} onRepost={handleRepost} liked={liked} likeCount={likeCount} comments={comments} reposted={reposted} commentCount={totalComments} />
        {/* YORUMLAR: Her zaman göster, X gibi */}
        {comments.length > 0 && (
          <CommentsSection comments={comments} onReply={handleReply} />
        )}
        {/* Silme dialogu */}
        <DeleteDreamDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleConfirmDelete} />
      </div>
    );
  }

  // Popüler rüyalar (en çok beğenilenler)
  const popularDreams = [...dreams].sort((a,b) => b.likes - a.likes).slice(0,3);
  // Filtreli rüyalar
  const filteredDreams = selectedTag
    ? dreams.filter(d => parseHashtags(d.content + ' ' + d.title).includes(selectedTag))
    : dreams;
  // Tüm hashtag'leri topla
  const allTags = Array.from(new Set(dreams.flatMap(d => parseHashtags(d.content + ' ' + d.title))));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" /> Keşfet
        </h1>
        <div className="flex items-center gap-2 mb-2">
          <Button variant={showPopular ? "default" : "outline"} size="sm" onClick={() => setShowPopular(true)}>
            Popüler Rüyalar
          </Button>
          <Button variant={!showPopular ? "default" : "outline"} size="sm" onClick={() => setShowPopular(false)}>
            Tüm Rüyalar
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSelectedTag(null)} title="Filtreyi temizle"><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <div className="mb-6">
          <HashtagExplore allTags={allTags} selectedTag={selectedTag} onTag={setSelectedTag} />
        </div>
        <div className="flex gap-2">
          <Input
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              searchUsers(e.target.value);
            }}
            placeholder="Rüya, kullanıcı adı veya isim ara..."
            className="max-w-lg w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "dreams" | "users")}>
          <TabsList>
            <TabsTrigger value="dreams">Rüyalar</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dreams" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (showPopular ? popularDreams : filteredDreams).length > 0 ? (
              <div className="flex flex-col gap-8">
                {(showPopular ? popularDreams : filteredDreams).map((dream) => (
                  <DreamFeedCard key={dream.id} dream={dream} onDelete={(id) => setDreams(ds => ds.filter(d => d.id !== id))} />
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Arama kriterlerine uygun rüya bulunamadı." : "Henüz paylaşılan rüya bulunmuyor."}
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2 mt-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded hover:bg-blue-50 transition">
                    <Link
                      to={`/profile/${user.username || user.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-lg">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-primary">{user.displayName}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </Link>
                    <Link to={`/messages/${user.username || user.id}`}> 
                      <Button variant="outline" size="sm">Mesaj Gönder</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Arama kriterlerine uygun kullanıcı bulunamadı." : "Kullanıcı aramak için arama terimini girin."}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Discover;
