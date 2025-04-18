import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Book, Share2, Lock, MessageSquare, Star, Sparkles, Moon as MoonIcon, Sun, Brain, Zap, Search } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";
import { Link } from "react-router-dom";
import { Cloud } from "@/components/Cloud";
import { Moon } from "@/components/Moon";
import NotificationBell from "@/components/notification";
import { useEffect, useState, useRef } from "react";
import { DreamCard } from "@/components/dream-card";
import { collection, query, orderBy, getDocs, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User } from "lucide-react";

// Framer Motion animasyonları için varyantlar
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const testimonials = [
  {
    name: "Ayşe Y.",
    avatar: "A",
    text: "Bring sayesinde rüyalarımı düzenli olarak kaydediyorum. Artık sabah kalktığımda ilk işim rüyamı yazmak oldu!",
    role: "Öğretmen"
  },
  {
    name: "Mehmet K.",
    avatar: "M",
    text: "AI yorumları gerçekten etkileyici. Rüyalarımın anlamını keşfetmek çok keyifli bir deneyim.",
    role: "Mühendis"
  },
  {
    name: "Zeynep A.",
    avatar: "Z",
    text: "Kullanımı çok kolay ve tasarımı harika. Rüyalarımı arkadaşlarımla paylaşmak çok eğlenceli.",
    role: "Grafik Tasarımcı"
  }
];

const dreamTags = ["Uçmak", "Düşmek", "Su", "Takip Edilmek", "Kaybolmak", "Sınav", "Eski Ev", "Tanıdık Yabancı"];

const stats = [
  { value: "10K+", label: "Kullanıcı" },
  { value: "50K+", label: "Rüya Kaydı" },
  { value: "25K+", label: "AI Yorumu" },
  { value: "4.8/5", label: "Kullanıcı Puanı" }
];

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: Error) => {
      console.error("Bileşen hatası:", error);
      setHasError(true);
    };

    window.addEventListener("error", (event) => {
      errorHandler(event.error);
    });

    return () => {
      window.removeEventListener("error", (event) => {
        errorHandler(event.error);
      });
    };
  }, []);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <p>Bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  return <>{children}</>;
};

const GEMINI_API_KEY = "AIzaSyC9s1KViXMx5ZQ-_GYcyKr0saBEs8ewpak";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const Index = () => {
  const { currentUser } = useAuth();
  const [myDreams, setMyDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popularDreams, setPopularDreams] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [activeTab, setActiveTab] = useState("featured");
  const [dailyInspiration, setDailyInspiration] = useState("");
  const [dreamInterpretation, setDreamInterpretation] = useState("");
  
  // Animasyon için ref'ler
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    const fetchDreamExample = async () => {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Bana rastgele bir rüya örneği ver. Örneğin 'Bu sabah rüyamda...' şeklinde başlasın. 1-2 cümleyi geçmesin."
              }]
            }]
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          setDreamInterpretation(data.candidates[0].content.parts[0].text);
        } else {
          setDreamInterpretation("Bu sabah rüyamda... (Örnek rüya)");
        }
      } catch (error) {
        console.error("Dream example fetch error:", error);
        setDreamInterpretation("Bu sabah rüyamda... (Örnek rüya)");
      }
    };

    const fetchDreamInterpretation = async () => {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Verilen bir rüyayı yorumla. Yorumun kısa ve açıklayıcı olsun. 1-2 cümleyi geçmesin."
              }]
            }]
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          setDailyInspiration(data.candidates[0].content.parts[0].text);
        } else {
          setDailyInspiration("Rüya yorumu burada görünecek... (Örnek yorum)");
        }
      } catch (error) {
        console.error("Dream interpretation fetch error:", error);
        setDailyInspiration("Rüya yorumu burada görünecek... (Örnek yorum)");
      } finally {
        setLoading(false);
      }
    };

    const handleRefreshDream = async () => {
      setLoading(true);
      await fetchDailyInspiration();
      await fetchDreamInterpretation();
    };

    const fetchDreams = async () => {
      if (!currentUser) {
        setMyDreams([]);
        setLoading(false);
        return;
      }

    fetchDailyInspiration();
    fetchDreamInterpretation();
      try {
        const dreamsQuery = query(
          collection(db, "dreams"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(6)
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
    
    const fetchPopularDreams = async () => {
      try {
        const popularQuery = query(
          collection(db, "dreams"),
          where("isPrivate", "==", false),
          orderBy("likes", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(popularQuery);
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
        setPopularDreams(dreamsList);
      } catch (error) {
        console.error("Popular dreams fetch error:", error);
      } finally {
        setLoadingPopular(false);
      }
    };
    
    fetchDreams();
    fetchPopularDreams();
  }, [currentUser]);

  const handleDeleteDream = (id) => {
    setMyDreams((prev) => prev.filter((d) => d.id !== id));
  };

  const handleRefreshDream = async () => {
    setLoading(true);
    await fetchDailyInspiration();
    await fetchDreamInterpretation();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f0fa] via-[#c9e2f5] to-[#1e355d] overflow-hidden">
      <Navbar />
      {/* Notification Bell */}
      {currentUser && (
        <div className="absolute right-8 top-8 z-50">
          <NotificationBell />
        </div>
      )}
      
      {/* Animasyonlu Arka Plan Öğeleri */}
      <div className="absolute left-0 top-0 w-full h-full z-0 pointer-events-none select-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="relative w-full h-full"
        >
          <Cloud className="absolute left-4 top-8 w-32 h-16 opacity-80" style={{ filter: 'blur(1px)' }} />
          <motion.div
            animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
          >
            <Cloud className="absolute right-12 top-0 w-40 h-20 opacity-60" style={{ filter: 'blur(2px)' }} />
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 240, ease: "linear" }}
            className="absolute right-24 top-10"
          >
            <Moon className="w-16 h-16 opacity-90" />
          </motion.div>
          
          {/* Ek Dekoratif Öğeler */}
          <motion.div 
            className="absolute bottom-20 left-10 text-blue-200 opacity-20"
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          >
            <Star size={40} />
          </motion.div>
          <motion.div 
            className="absolute top-40 right-40 text-blue-300 opacity-20"
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          >
            <Sparkles size={50} />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={fadeIn}
        className="pt-28 pb-16 px-4 md:px-6 max-w-6xl mx-auto relative z-10"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <motion.div 
            className="flex-1 space-y-6"
            variants={staggerContainer}
          >
            <motion.div variants={scaleIn}>
              <img 
                src="/vvvvv.png" 
                alt="Bring Logo" 
                className="h-24 w-auto mb-4 drop-shadow-2xl mx-auto md:mx-0 bg-white/70 rounded-2xl p-3 border border-blue-200 hover:shadow-blue-300/50 hover:shadow-lg transition-all duration-300" 
                style={{maxWidth: 240}} 
              />
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-extrabold leading-tight bg-gradient-to-r from-[#1e355d] via-[#2a406c] to-[#4fc3f7] bg-clip-text text-transparent drop-shadow-xl w-full max-w-3xl mx-auto text-center md:text-left whitespace-pre-line break-words"
            >
              Hayal Gücünün Anahtarı
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-[#2a406c] font-medium max-w-2xl"
            >
              Her sabah yeni bir başlangıç. Rüyalarını kaydet, keşfet ve paylaş. 
              <span className="font-semibold text-[#1e355d]">Sınırları olmayan bir dünyaya adım at.</span>
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap gap-4 pt-6"
            >
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-[#1e355d] to-[#4fc3f7] text-white shadow-xl hover:from-[#2a406c] hover:to-[#81d4fa] transition-all duration-300 font-bold px-8 py-6 text-lg rounded-xl hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" /> Hemen Başla
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="border-[#1e355d] text-[#1e355d] font-bold px-8 py-6 text-lg hover:bg-[#e3f0fa] hover:text-[#2a406c] rounded-xl hover:scale-105 transition-all duration-300">
                  <MoonIcon className="mr-2 h-5 w-5" /> Daha Fazla Öğren
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Sağ taraf için yeni eklenen animasyonlu görsel */}
          <motion.div 
            className="flex-1 mt-10 md:mt-0 hidden md:block"
            initial={{ opacity: 0, x: 50 }}
            animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative bg-gradient-to-br from-white/30 to-blue-100/30 p-6 rounded-2xl border border-blue-100 shadow-xl backdrop-blur-sm">
              <div className="absolute -top-4 -right-4 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg cursor-pointer" onClick={handleRefreshDream}>
                Yenile
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 mb-4">
                <p className="text-[#1e355d] font-bold italic">Rüya</p>
                <p className="text-[#2a406c]">{dreamInterpretation || "Bu sabah rüyamda..."}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <p className="text-[#1e355d] font-bold italic">Yorum</p>
                <p className="text-[#1e355d] font-medium">{dailyInspiration || "Rüya yorumu burada görünecek..."}</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* İstatistikler */}
        <motion.div 
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-2">
              <motion.div 
                className="text-3xl font-bold text-[#1e355d]"
                initial={{ scale: 0.8 }}
                animate={heroInView ? { scale: 1 } : { scale: 0.8 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-[#2a406c] font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.section>
      
      {/* Features Section */}
      <motion.section 
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={fadeIn}
        className="py-16 px-4 md:px-6 max-w-6xl mx-auto" 
        id="features"
      >
        <motion.div 
          className="text-center mb-12"
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold mb-4 text-[#1e355d] drop-shadow-sm">Bring ile Neler Yapabilirsin?</h2>
          <p className="text-[#2a406c] max-w-2xl mx-auto text-lg">
            Hayallerini güvenle kaydet, ister paylaş ister sakla, ister yorumla. Hepsi senin kontrolünde.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={staggerContainer}
        >
          <motion.div variants={scaleIn}>
            <FeatureCard
              icon={<Book size={32} color="#1e355d" />}
              title="Rüya Günlüğü"
              description="Her sabah uyandığında rüyalarını kaydet, zamanla kendi hayal atlasını oluştur."
            />
          </motion.div>
          <motion.div variants={scaleIn}>
            <FeatureCard
              icon={<Share2 size={32} color="#1976d2" />}
              title="Paylaşım"
              description="Dilersen rüyalarını toplulukla paylaş, dilersen sadece kendine sakla. Seçim senin."
            />
          </motion.div>
          <motion.div variants={scaleIn}>
            <FeatureCard
              icon={<MessageSquare size={32} color="#0d47a1" />}
              title="AI Yorum"
              description="Yapay zeka ile rüyalarının gizemini çöz, yeni anlamlar keşfet."
            />
          </motion.div>
          <motion.div variants={scaleIn}>
            <FeatureCard
              icon={<Lock size={32} color="#1565c0" />}
              title="Gizlilik"
              description="Rüyalarını kimlerin görebileceğine sen karar ver. Tam gizlilik, tam özgürlük."
            />
          </motion.div>
        </motion.div>
        
        {/* Popüler Etiketler */}
        <motion.div 
          className="mt-16 p-6 bg-white/40 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100"
          variants={fadeInUp}
        >
          <h3 className="text-2xl font-bold text-[#1e355d] mb-4">Popüler Rüya Etiketleri</h3>
          <div className="flex flex-wrap gap-3">
            {dreamTags.map((tag, index) => (
              <motion.div 
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={featuresInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Badge 
                  className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-[#e3f0fa] to-[#c9e2f5] text-[#1e355d] hover:from-[#1e355d] hover:to-[#4fc3f7] hover:text-white cursor-pointer transition-all duration-300 border border-blue-100"
                >
                  #{tag}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Öne Çıkan Özellikler */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-blue-100 shadow-xl hover:shadow-blue-200/50 transition-all duration-300 h-full">
              <div className="p-6 bg-gradient-to-br from-[#1e355d] to-[#4fc3f7] text-white">
                <div className="flex items-center mb-2">
                  <Star className="h-6 w-6 mr-2" />
                  <h3 className="text-2xl font-bold">Günün İlhamı</h3>
                </div>
                <p className="opacity-90">Her gün seni motive edecek yeni bir rüya sözüyle güne başla.</p>
              </div>
              <CardContent className="p-6 bg-white">
                <blockquote className="italic text-[#1e355d] font-semibold text-lg border-l-4 border-[#4fc3f7] pl-4 py-2">
                  "{dailyInspiration || "Hayallerin sınırı yoktur, sadece senin cesaretin var."}"
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-blue-100 shadow-xl hover:shadow-blue-200/50 transition-all duration-300 h-full">
              <div className="p-6 bg-gradient-to-br from-[#e3f0fa] to-[#c9e2f5]">
                <div className="flex items-center mb-2">
                  <Zap className="h-6 w-6 mr-2 text-[#1e355d]" />
                  <h3 className="text-2xl font-bold text-[#1e355d]">Hızlı Kayıt</h3>
                </div>
                <p className="text-[#2a406c]">Tek tıkla rüya ekle, ister yaz ister sesli kaydet. Mobilde de süper hızlı!</p>
              </div>
              <CardContent className="p-6 flex justify-center bg-white">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="bg-gradient-to-r from-[#1976d2] to-[#4fc3f7] text-white font-bold px-6 py-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="mr-2 h-5 w-5" /> Rüya Ekle
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        
        {/* Ek Özellikler */}
        <motion.div 
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
        >
          <motion.div variants={scaleIn}>
            <Card className="h-full border-blue-100 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0d47a1] to-[#4fc3f7] flex items-center justify-center text-white mb-4">
                  <MoonIcon size={24} />
                </div>
                <h4 className="text-lg font-semibold text-[#0d47a1] mb-2">Karanlık Mod</h4>
                <p className="text-[#2a406c]">Gözlerini yormadan rüyalarını kaydet, gece-gündüz sana uyum sağlar.</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={scaleIn}>
            <Card className="h-full border-blue-100 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1976d2] to-[#4fc3f7] flex items-center justify-center text-white mb-4">
                  <User size={24} />
                </div>
                <h4 className="text-lg font-semibold text-[#1976d2] mb-2">Topluluk Etkileşimi</h4>
                <p className="text-[#2a406c]">Diğer kullanıcıların rüyalarını keşfet, beğen ve yorum yap. İlham al, paylaş.</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={scaleIn}>
            <Card className="h-full border-blue-100 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1e355d] to-[#4fc3f7] flex items-center justify-center text-white mb-4">
                  <Search size={24} />
                </div>
                <h4 className="text-lg font-semibold text-[#1e355d] mb-2">Gelişmiş Arama</h4>
                <p className="text-[#2a406c]">Rüyalarını anahtar kelimeye, tarihe veya etikete göre kolayca bul.</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        
        {/* Rüya Keşfi Bölümü */}
        <motion.div 
          className="mt-16"
          variants={fadeInUp}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-[#1e355d]">Rüya Keşfi</h3>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-white/50 border border-blue-100">
                <TabsTrigger value="featured" className="data-[state=active]:bg-[#1e355d] data-[state=active]:text-white">
                  Öne Çıkanlar
                </TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-[#1e355d] data-[state=active]:text-white">
                  Rüyalarım
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-2 mb-6">
    <TabsTrigger value="featured">Öne Çıkanlar</TabsTrigger>
    <TabsTrigger value="popular">Popüler</TabsTrigger>
  </TabsList>
  <TabsContent value="featured">
    {loading ? (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    ) : myDreams.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myDreams.map((dream) => (
          <DreamCard
            key={dream.id}
            dream={dream}
            onDelete={handleDeleteDream}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <p className="text-gray-500">Henüz bir rüya kaydetmediniz.</p>
      </div>
    )}
  </TabsContent>
  <TabsContent value="popular">
    {loadingPopular ? (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    ) : popularDreams.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularDreams.map((dream) => (
          <DreamCard
            key={dream.id}
            dream={dream}
            onDelete={handleDeleteDream}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <p className="text-gray-500">Henüz popüler rüya yok.</p>
      </div>
    )}
  </TabsContent>
</Tabs>
        </motion.div>
        
        {/* Kullanıcı Yorumları */}
        <motion.div 
          className="mt-16"
          variants={fadeInUp}
        >
          <h3 className="text-2xl font-bold text-[#1e355d] mb-6 text-center">Kullanıcılarımız Ne Diyor?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.2 * index }}
              >
                <Card className="h-full border-blue-100 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Avatar className="h-10 w-10 mr-3 border-2 border-[#4fc3f7]">
                        <AvatarImage src="" alt={testimonial.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#1e355d] to-[#4fc3f7] text-white">
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-[#1e355d]">{testimonial.name}</h4>
                        <p className="text-sm text-[#2a406c]">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-[#2a406c] italic">{testimonial.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.section>
      
      {/* How It Works Section */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-br from-[#e3f0fa] to-[#c9e2f5] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-[#1e355d] drop-shadow-sm">Nasıl Çalışır?</h2>
            <p className="text-[#2a406c] max-w-2xl mx-auto text-lg">
              Bring ile hayallerine yolculuk başlasın. Sadece üç adımda: Kayıt ol, rüyanı yaz, yeni anlamlar keşfet.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="flex flex-col items-center text-center p-6 bg-white/70 rounded-xl shadow-lg border border-blue-100 hover:shadow-blue-200/50 hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e355d] to-[#4fc3f7] flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-md">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#1e355d]">Kayıt Ol</h3>
              <p className="text-[#2a406c]">
                Ücretsiz kaydol, Bring dünyasına ilk adımını at.
              </p>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center text-center p-6 bg-white/70 rounded-xl shadow-lg border border-blue-100 hover:shadow-blue-200/50 hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1976d2] to-[#4fc3f7] flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-md">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#1976d2]">Rüyanı Kaydet</h3>
              <p className="text-[#2a406c]">
                Rüyanı yaz, ister paylaş ister gizli tut.
              </p>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center text-center p-6 bg-white/70 rounded-xl shadow-lg border border-blue-100 hover:shadow-blue-200/50 hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0d47a1] to-[#4fc3f7] flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-md">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0d47a1]">Yorumla & Keşfet</h3>
              <p className="text-[#2a406c]">
                Yapay zeka ile rüyalarının anlamını keşfet, topluluğu incele.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4 md:px-6 max-w-6xl mx-auto text-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Dekoratif arka plan öğeleri */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-blue-100 opacity-40 blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 10, 0], y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-20 -right-10 w-60 h-60 rounded-full bg-blue-200 opacity-30 blur-3xl"
            animate={{ scale: [1, 1.1, 1], x: [0, -15, 0], y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />
        </div>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#1e355d] drop-shadow-sm">
            Hayallerini kaydetmeye hazır mısın?
          </h2>
          <p className="text-lg md:text-xl text-[#2a406c] mb-8 max-w-2xl mx-auto">
            Hemen ücretsiz bir hesap oluştur, Bring ile rüyalarını güvenle sakla ve keşfetmeye başla.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-[#4fc3f7] to-[#1e355d] text-white shadow-xl hover:from-[#81d4fa] hover:to-[#2a406c] transition-all duration-300 font-bold px-8 py-6 text-lg border-2 border-[#4fc3f7] rounded-xl">
                  <Sparkles className="mr-2 h-5 w-5" /> Hemen Kayıt Ol
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link to="/login">
                <Button variant="outline" size="lg" className="bg-gradient-to-r from-[#e3f0fa] to-[#c9e2f5] text-[#1e355d] font-bold px-8 py-6 text-lg border-2 border-[#1e355d] hover:bg-[#4fc3f7] hover:text-white hover:border-[#4fc3f7] transition-all duration-300 rounded-xl">
                  <User className="mr-2 h-5 w-5" /> Giriş Yap
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-blue-100 bg-gradient-to-b from-[#e3f0fa] to-[#c9e2f5] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <img src="/vvvvv.png" alt="Bring Logo" className="h-8 w-auto drop-shadow-lg bg-white/70 rounded-lg p-1" style={{maxWidth: 60}} />
              <span className="text-xl font-bold text-[#1e355d]">Bring</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link to="/about" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors font-medium">Hakkımızda</Link>
              <Link to="/discover" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors font-medium">Keşfet</Link>
              <Link to="/login" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors font-medium">Giriş Yap</Link>
              <Link to="/register" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors font-medium">Kayıt Ol</Link>
            </div>
          </div>
          <div className="border-t border-blue-100 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-[#2a406c] mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Bring. Hayallerin sana ait.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                </svg>
              </a>
              <a href="#" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                </svg>
              </a>
              <a href="#" className="text-[#1e355d] hover:text-[#4fc3f7] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
