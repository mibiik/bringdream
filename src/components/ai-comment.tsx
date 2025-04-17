import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { interpretDream } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { AIPopup } from "@/components/ai-popup";

// **kalın** işaretlemelerini <b>kalın</b> olarak dönüştüren yardımcı fonksiyon
function renderBold(text: string, preview?: string) {
  // Eğer preview varsa, sadece preview'u işle (aksi halde tam metin)
  let str = preview !== undefined ? preview : text;
  // Önce: başında veya satır başında ' * **kalın**' gibi kalan yıldızları kaldır
  str = str.replace(/(^|\n)\s*\*\s*(?=\*\*)/g, '$1');
  // Ardından **kalın** -> <b>kalın</b>
  return str.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
}

import { DreamInterpretationMode } from "@/lib/gemini";

function isDefneUser(user: { displayName?: string; username?: string }) {
  if (!user) return false;
  // İsimdeki tüm boşlukları ve Türkçe karakter farklılıklarını normalize et
  const name = (user.displayName || "").toLowerCase().replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/[^a-z0-9]/g, "").trim();
  // Tüm varyasyonları kapsayan anahtarlar
  const allowed = [
    "defne",
    "defneoz",
    "ahmetdemir"
  ];
  return allowed.some(key => name === key);
}

const MODES: { label: string; value: DreamInterpretationMode }[] = [
  { label: "Klasik", value: "klasik" },
  // Gizli Yorum (😱) sadece Defne için
  { label: "Gizli Yorum (😱)", value: "olumlu" },
  { label: "Kabus/Uyarı", value: "kabus" },
  { label: "Freud (Psikanaliz)", value: "freud" },
  { label: "Jung (Arketipsel)", value: "jung" },
  { label: "Arabi (Tasavvufi)", value: "arabi" },
  { label: "Modern Yorumcu", value: "modern" },
  { label: "Kısa & Net", value: "kisa" },
];

interface AICommentProps {
  dreamId: string;
  dreamContent: string;
  onNewAIComment: (comment: string) => void;
}

export function AIComment({ dreamId, dreamContent, onNewAIComment }: AICommentProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiComment, setAIComment] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [commentDocId, setCommentDocId] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [mode, setMode] = useState<DreamInterpretationMode>("klasik");
  // Tüm AI yorumlarını tutan state
  const [allAIComments, setAllAIComments] = useState<{id: string, text: string, mode: DreamInterpretationMode, createdAt: Date}[]>([]);

  // Kullanıcının bu rüya için kaç AI yorumu var ve en sonuncusu nedir?
  useEffect(() => {
    if (!currentUser || !dreamId) return;
    const fetchAIComments = async () => {
      const q = query(
        collection(db, "ai-comments"),
        where("dreamId", "==", dreamId),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const key = `ai-comment-limit-${dreamId}-${currentUser.uid}`;
      // Tüm yorumları (text ve lengthType ile) bir diziye aktar
      const allComments = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        mode: doc.data().mode || "klasik",
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));
      setAllAIComments(allComments); // yeni state
      setCommentCount(allComments.length);
      if (allComments.length >= 3) {
        localStorage.setItem(key, "1");
      } else {
        localStorage.removeItem(key);
      }
    };
    fetchAIComments();
  }, [currentUser, dreamId]);

  // MODES listesini filtrele: olumlu (gizli) sadece Defne ise göster
  const filteredModes = MODES.filter(
    m => m.value !== "olumlu" || isDefneUser(currentUser || {})
  );

  // --- YAPAY ZEKA YORUMU EKLEME/GÜNCELLEME ---
  const handleAIComment = async () => {
    setLoading(true);
    setAIComment(null);
    try {
      // Aynı modda eski bir yorum varsa onu sil
      const existing = allAIComments.find(c => c.mode === mode);
      if (existing) {
        await deleteDoc(doc(db, "ai-comments", existing.id));
      }
      const { result, mode: usedMode } = await interpretDream(dreamContent, mode, currentUser || undefined);
      // Yorum Firestore'a kaydedilsin (ai-comments koleksiyonuna, mode ile birlikte)
      const docRef = await addDoc(collection(db, "ai-comments"), {
        dreamId,
        text: result,
        mode: usedMode,
        createdAt: new Date(),
        userId: currentUser.uid,
        userName: currentUser.displayName || "Sen",
        userAvatar: currentUser.photoURL || null
      });
      setAIComment(result);
      setMode(usedMode as DreamInterpretationMode);
      setCommentDocId(docRef.id);
      // YENİ YORUMU ANINDA KARTLARA YANSIT
      setAllAIComments(prev => {
        // Aynı mode varsa güncelle, yoksa ekle
        const filtered = prev.filter(c => c.mode !== usedMode);
        return [
          ...filtered,
          {
            id: docRef.id,
            text: result,
            mode: usedMode,
            createdAt: new Date()
          }
        ];
      });
      setCommentCount(prev => {
        const newCount = allAIComments.filter(c => c.mode !== usedMode).length + 1;
        // Hak limiti localStorage'a kaydedilsin
        if (newCount >= 3) {
          localStorage.setItem(`ai-comment-limit-${dreamId}-${currentUser.uid}`, "1");
        } else {
          localStorage.removeItem(`ai-comment-limit-${dreamId}-${currentUser.uid}`);
        }
        return newCount;
      });
      onNewAIComment(result);
    } catch (e) {
      setAIComment("Yorum alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedAIComment, setSelectedAIComment] = useState<{id: string, text: string, mode: DreamInterpretationMode, createdAt: Date} | null>(null);

  const isLong = aiComment && aiComment.length > 180;
  const preview = aiComment && isLong ? aiComment.slice(0, 180) + "..." : aiComment;

  return (
    <div className="border rounded-lg bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-semibold">Sihirli Yorumlama</span>
      </div>
      {/* Kalan hakları kontrol et, 3 hak dolduysa uyarı ve buton disable */}
      {/* AI yorum kartları her zaman görünür */}
      {allAIComments.length > 0 && (
        <div className="flex flex-col gap-2 my-3 w-full">
          {allAIComments.map((c, i) => (
            <div
              key={c.id}
              className="cursor-pointer w-full p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all shadow-sm flex flex-col gap-1"
              onClick={() => { setPopupOpen(true); setSelectedAIComment(c); }}
              title="Detaylı gör"
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-700">
                  {c.mode === "klasik" ? "Klasik" : c.mode === "olumlu" ? "Gizli Yorum (😱)" : c.mode === "kabus" ? "Kabus/Uyarı" : c.mode === "freud" ? "Freud (Psikanaliz)" : c.mode === "jung" ? "Jung (Arketipsel)" : c.mode === "arabi" ? "Arabi (Tasavvufi)" : c.mode === "modern" ? "Modern Yorumcu" : "Kısa & Net"}
                </span>
                <span className="text-xs text-muted-foreground">Yorum {i+1}</span>
              </div>
              <div className="text-xs text-blue-900 mt-1 w-full" style={{width:'100%', maxWidth:'100%', whiteSpace:'pre-line', display:'-webkit-box', WebkitLineClamp:5, WebkitBoxOrient:'vertical', overflow:'hidden'}}
                dangerouslySetInnerHTML={{__html: renderBold(c.text)}}
              />
            </div>
          ))}
        </div>
      )}
      {selectedAIComment && (
        <AIPopup comment={selectedAIComment.text} open={popupOpen} onClose={() => setPopupOpen(false)} />
      )}
      {/* Yorumlatma hakkı bitmediyse yorumlatma arayüzü görünür */}
      {commentCount < 3 && (
        <div className="flex flex-col items-center mb-3">
          <div className="flex gap-3 flex-wrap justify-center mb-2">
            {filteredModes.map((m) => (
              <Button
                key={m.value}
                variant={mode === m.value ? "default" : "outline"}
                size="sm"
                className={`rounded-full px-5 font-semibold transition-all duration-150 ${mode === m.value ? "shadow-lg scale-105" : ""}`}
                onClick={() => {
                  setMode(m.value);
                  setAIComment(null);
                }}
                disabled={loading}
              >
                {m.label}
              </Button>
            ))}
          </div>
          {/* Seçim yapıldıysa buton */}
          {mode && (
            <Button onClick={handleAIComment} disabled={loading} className="gap-2 mt-2 w-full max-w-xs mx-auto">
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              Rüyayı Yorumlat ({3 - commentCount} hakkınız kaldı)
            </Button>
          )}
        </div>
      )}
      {aiComment && (
        <AIPopup comment={aiComment} />
      )}
      {/* Alt kısımda Geri butonu kaldırıldı. */}
    </div>
  );
}
