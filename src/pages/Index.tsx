import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Book, Share2, Lock, MessageSquare } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";
import { Link } from "react-router-dom";
import { Cloud } from "@/components/Cloud";
import { Moon } from "@/components/Moon";
import NotificationBell from "@/components/notification";
import { useEffect, useState } from "react";
import { DreamCard } from "@/components/dream-card";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";

const Index = () => {
  const { currentUser } = useAuth();
  const [myDreams, setMyDreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDreams = async () => {
      if (!currentUser) {
        setMyDreams([]);
        setLoading(false);
        return;
      }
      try {
        const dreamsQuery = query(
          collection(db, "dreams"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(dreamsQuery);
        const dreamsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            createdAt: data.createdAt && data.createdAt.toDate ? new Date(data.createdAt.toDate()).toLocaleDateString("tr-TR") : "",
            isPrivate: data.isPrivate,
            likes: data.likes || 0,
            comments: data.comments || 0,
            user: {
              id: data.userId || "",
              name: data.userName || "Kullanıcı",
              avatar: data.userAvatar || "",
            },
          };
        });
        setMyDreams(dreamsList);
      } catch (error) {
        console.error("Dreams fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDreams();
  }, [currentUser]);

  const handleDeleteDream = (id) => {
    setMyDreams((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f0fa] via-[#c9e2f5] to-[#1e355d]">
      <Navbar />
      {/* Notification Bell */}
      {currentUser && (
        <div className="absolute right-8 top-8 z-50">
          <NotificationBell />
        </div>
      )}
      {/* Decorative Clouds and Moon */}
      <div className="absolute left-0 top-0 w-full z-0 pointer-events-none select-none">
        <div className="relative w-full h-40">
          <Cloud className="absolute left-4 top-8 w-32 h-16 opacity-80" style={{ filter: 'blur(1px)' }} />
          <Cloud className="absolute right-12 top-0 w-40 h-20 opacity-60" style={{ filter: 'blur(2px)' }} />
          <Moon className="absolute right-24 top-10 w-16 h-16 opacity-90" />
        </div>
      </div>
      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 md:px-6 max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-6">
            <img src="/vvvvv.png" alt="Bring Logo" className="h-20 w-auto mb-4 drop-shadow-2xl mx-auto md:mx-0 bg-white/70 rounded-2xl p-2 border border-blue-200" style={{maxWidth: 220}} />
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-[#1e355d] via-[#2a406c] to-[#4fc3f7] bg-clip-text text-transparent drop-shadow-xl w-full max-w-3xl mx-auto text-center whitespace-pre-line break-words">
              Hayal Gücünün Anahtarı
            </h1>
            <p className="text-lg text-[#2a406c] font-medium">
              Her sabah yeni bir başlangıç. Rüyalarını kaydet, keşfet ve paylaş. Sınırları olmayan bir dünyaya adım at.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-[#1e355d] to-[#4fc3f7] text-white shadow-xl hover:from-[#2a406c] hover:to-[#81d4fa] transition font-bold px-8 py-2 text-lg">
                  Hemen Başla
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="border-[#1e355d] text-[#1e355d] font-bold px-8 py-2 text-lg hover:bg-[#e3f0fa] hover:text-[#2a406c]">
                  Daha Fazla Öğren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 md:px-6 max-w-6xl mx-auto" id="features">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#1e355d]">Bring ile Neler Yapabilirsin?</h2>
          <p className="text-[#2a406c] max-w-2xl mx-auto text-lg">
            Hayallerini güvenle kaydet, ister paylaş ister sakla, ister yorumla. Hepsi senin kontrolünde.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Book size={28} color="#1e355d" />}
            title="Rüya Günlüğü"
            description="Her sabah uyandığında rüyalarını kaydet, zamanla kendi hayal atlasını oluştur."
          />
          <FeatureCard
            icon={<Share2 size={28} color="#1976d2" />}
            title="Paylaşım"
            description="Dilersen rüyalarını toplulukla paylaş, dilersen sadece kendine sakla. Seçim senin."
          />
          <FeatureCard
            icon={<MessageSquare size={28} color="#0d47a1" />}
            title="AI Yorum"
            description="Yapay zeka ile rüyalarının gizemini çöz, yeni anlamlar keşfet."
          />
          <FeatureCard
            icon={<Lock size={28} color="#1565c0" />}
            title="Gizlilik"
            description="Rüyalarını kimlerin görebileceğine sen karar ver. Tam gizlilik, tam özgürlük."
          />
        </div>
        {/* --- YENİ EKLENTİLER --- */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white/80 rounded-2xl shadow-xl border border-blue-100 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-[#1976d2] mb-2">Günün İlhamı</h3>
            <p className="text-[#2a406c] mb-4">Her gün seni motive edecek yeni bir rüya sözüyle güne başla.</p>
            <blockquote className="italic text-[#1e355d] font-semibold">"Hayallerin sınırı yoktur, sadece senin cesaretin var."</blockquote>
          </div>
          <div className="p-8 bg-gradient-to-br from-[#e3f0fa] to-[#c9e2f5] rounded-2xl shadow-xl border border-blue-100 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-[#1e355d] mb-2">Hızlı Kayıt</h3>
            <p className="text-[#2a406c] mb-4">Tek tıkla rüya ekle, ister yaz ister sesli kaydet. Mobilde de süper hızlı!</p>
            <Button variant="default" size="lg" className="bg-gradient-to-r from-[#1976d2] to-[#4fc3f7] text-white font-bold px-6 py-2 mt-2 shadow-md">Rüya Ekle</Button>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white/80 rounded-xl shadow-lg border border-blue-100">
            <h4 className="text-lg font-semibold text-[#0d47a1] mb-2">Karanlık Mod</h4>
            <p className="text-[#2a406c]">Gözlerini yormadan rüyalarını kaydet, gece-gündüz sana uyum sağlar.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white/80 rounded-xl shadow-lg border border-blue-100">
            <h4 className="text-lg font-semibold text-[#1976d2] mb-2">Topluluk Etkileşimi</h4>
            <p className="text-[#2a406c]">Diğer kullanıcıların rüyalarını keşfet, beğen ve yorum yap. İlham al, paylaş.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white/80 rounded-xl shadow-lg border border-blue-100">
            <h4 className="text-lg font-semibold text-[#1e355d] mb-2">Gelişmiş Arama</h4>
            <p className="text-[#2a406c]">Rüyalarını anahtar kelimeye, tarihe veya etikete göre kolayca bul.</p>
          </div>
        </div>
        {/* Kendi Rüyalarım */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-[#1e355d] mb-6">Rüyalarım</h3>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : currentUser ? (
            myDreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDreams.map((dream) => (
                  <DreamCard key={dream.id} dream={dream} onDelete={handleDeleteDream} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Henüz rüya kaydetmediniz.</div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">Rüyalarını görmek için giriş yap.</div>
          )}
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 px-4 md:px-6 bg-[#e3f0fa] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[#1e355d]">Nasıl Çalışır?</h2>
            <p className="text-[#2a406c] max-w-2xl mx-auto text-lg">
              Bring ile hayallerine yolculuk başlasın. Sadece üç adımda: Kayıt ol, rüyanı yaz, yeni anlamlar keşfet.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white/70 rounded-xl shadow-lg border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1e355d] to-[#4fc3f7] flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#1e355d]">Kayıt Ol</h3>
              <p className="text-[#2a406c]">
                Ücretsiz kaydol, Bring dünyasına ilk adımını at.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/70 rounded-xl shadow-lg border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1976d2] to-[#4fc3f7] flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#1976d2]">Rüyanı Kaydet</h3>
              <p className="text-[#2a406c]">
                Rüyanı yaz, ister paylaş ister gizli tut.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/70 rounded-xl shadow-lg border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0d47a1] to-[#4fc3f7] flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0d47a1]">Yorumla & Keşfet</h3>
              <p className="text-[#2a406c]">
                Yapay zeka ile rüyalarının anlamını keşfet, topluluğu incele.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1e355d]">
          Hayallerini kaydetmeye hazır mısın?
        </h2>
        <p className="text-lg text-[#2a406c] mb-8 max-w-2xl mx-auto">
          Hemen ücretsiz bir hesap oluştur, Bring ile rüyalarını güvenle sakla ve keşfetmeye başla.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-[#4fc3f7] to-[#1e355d] text-white shadow-xl hover:from-[#81d4fa] hover:to-[#2a406c] transition font-bold px-8 py-2 text-lg border-2 border-[#4fc3f7]">
              Hemen Kayıt Ol
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="bg-gradient-to-r from-[#e3f0fa] to-[#c9e2f5] text-[#1e355d] font-bold px-8 py-2 text-lg border-2 border-[#1e355d] hover:bg-[#4fc3f7] hover:text-white hover:border-[#4fc3f7] transition">
              Giriş Yap
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t border-blue-100 bg-[#e3f0fa] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img src="/vvvvv.png" alt="Bring Logo" className="h-5 w-auto drop-shadow-lg" style={{maxWidth: 40}} />
          </div>
          <div className="text-sm text-[#2a406c]">
            &copy; {new Date().getFullYear()} Bring. Hayallerin sana ait.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
