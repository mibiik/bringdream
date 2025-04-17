import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, Lock, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-provider";
import { DeleteDreamDialog } from "@/components/DeleteDreamDialog";
import { safeDeleteDream } from "@/lib/deleteDream";

interface DreamCardProps {
  dream: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    isPrivate: boolean;
    likes: number;
    comments: any[];
    user: {
      id: string;
      name: string;
      avatar: string;
      username?: string;
    };
  };
  onDelete?: (id: string) => void;
}

function CommentsSection({ comments, onReply }: { comments: any[], onReply: (commentId: string, text: string) => void }) {
  const [replyingTo, setReplyingTo] = useState<string|null>(null);
  const [replyText, setReplyText] = useState("");
  return (
    <div className="mt-3 border-t pt-3">
      {comments.map((c: any) => (
        <div key={c.id} className="mb-2">
          <div className="flex items-center gap-2">
            <img src={c.user.avatar} alt={c.user.name} className="h-6 w-6 rounded-full border" />
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

export function DreamCard({ dream, onDelete }: DreamCardProps) {
  const { currentUser } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  // Eğer bir daha gösterme işaretliyse popup gösterme
  const shouldShowDialog = () => localStorage.getItem("hideDeleteDreamDialog") !== "1";

  // Kart tıklanınca detay sayfasına git
  const handleCardClick = () => {
    window.location.href = `/dream/${dream.id}`;
  };

  // --- BEĞENİ STATE ---
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(dream.likes || 0);
  const [likers, setLikers] = useState<string[]>([]); // beğenenlerin isimleri
  const [showLikers, setShowLikers] = useState(false);
  // --- REPOST STATE ---
  const [reposted, setReposted] = useState(false);

  // Yorumlara yanıt verme
  const [comments, setComments] = useState<any[]>(Array.isArray(dream.comments) ? dream.comments : []);
  const handleReply = (commentId: string, text: string) => {
    setComments(comments => comments.map(c => c.id === commentId ? {
      ...c,
      replies: [...(c.replies || []), { id: Date.now().toString(), user: { name: "Sen", avatar: "" }, text }]
    } : c));
  };

  // BEĞENİ FONKSİYONU (örnek: local, backend entegrasyonu eklenebilir)
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setLikeCount(likeCount + 1);
      setLikers([...likers, currentUser?.displayName || "Sen"]);
    } else {
      setLiked(false);
      setLikeCount(likeCount - 1);
      setLikers(likers.filter(name => name !== (currentUser?.displayName || "Sen")));
    }
  };

  // REPOST FONKSİYONU (örnek: local, backend entegrasyonu eklenebilir)
  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReposted(true);
    // burada backend'e repost kaydı eklenebilir
  };

  return (
    <Card
      className="overflow-hidden border border-border/50 bg-background/95 backdrop-blur-sm hover:shadow-md transition-all relative"
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (deleteDialogOpen) return;
        handleCardClick();
      }}
    >
      {/* Sil butonu sadece kendi rüyasında */}
      {currentUser && dream.user.id === currentUser.uid && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); e.preventDefault(); handleDeleteClick(e as any); }}
            className="dream-delete-btn absolute top-3 right-3 z-50 bg-transparent border-none p-1 rounded-full hover:bg-red-50"
            title="Rüyayı Sil"
          >
            <Trash2 className="h-6 w-6 text-red-500 hover:text-red-700 transition-colors" />
          </button>
          <DeleteDreamDialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={async () => {
              setDeleteDialogOpen(false);
              await safeDeleteDream(dream.id);
              if (onDelete) onDelete(dream.id);
            }}
            minimal
          />
        </>
      )}
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={dream.user.avatar} alt={dream.user.name} />
            <AvatarFallback>{dream.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <a
              href={`/profile/${dream.user.username || dream.user.id}`}
              className="text-sm font-medium text-primary hover:underline cursor-pointer"
              onClick={e => e.stopPropagation()}
            >
              {dream.user.name}
            </a>
            <span className="text-xs text-muted-foreground">{dream.createdAt}</span>
          </div>
          {dream.isPrivate && (
            <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{dream.title}</h3>
        <CardDescription className="text-sm line-clamp-3">
          {dream.content}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant={liked ? "default" : "ghost"} size="sm" className="h-8 px-2 gap-1" onClick={handleLike} aria-pressed={liked}>
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-xs cursor-pointer underline decoration-dotted" onClick={e => { e.stopPropagation(); setShowLikers(true); }}>{likeCount}</span>
          </Button>
          {/* Beğenenleri gösteren modal veya popup */}
          {showLikers && (
            <div className="absolute z-50 bg-white border rounded shadow p-2 top-12 left-4 min-w-[120px]" onClick={e => e.stopPropagation()}>
              <div className="font-semibold mb-1 text-sm">Beğenenler</div>
              {likers.length === 0 ? (
                <div className="text-xs text-muted-foreground">Henüz beğeni yok</div>
              ) : (
                likers.map((name, i) => <div key={i} className="text-xs">{name}</div>)
              )}
              <Button variant="ghost" size="xs" className="mt-1" onClick={() => setShowLikers(false)}>Kapat</Button>
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{Array.isArray(dream.comments) ? dream.comments.length : 0}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={reposted ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={handleRepost} aria-pressed={reposted}>
            <Share2 className={`h-4 w-4 ${reposted ? 'text-blue-500' : ''}`} />
            <span className="text-xs">{reposted ? 'Paylaşıldı' : 'Paylaş'}</span>
          </Button>
        </div>
      </CardFooter>
      {/* YORUMLAR: Her zaman göster, X gibi */}
      {comments.length > 0 && (
        <CommentsSection comments={comments} onReply={handleReply} />
      )}
    </Card>
  );
}
