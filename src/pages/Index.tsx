import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Book, Share2, Lock, MessageSquare, Star, Sparkles, Moon as MoonIcon, Sun, Brain, Zap } from "lucide-react";
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
import { Loader2 } from "lucide-react";

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

const Index = () => {
  const { currentUser } = useAuth();
  const [myDreams, setMyDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popularDreams, setPopularDreams] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [activeTab, setActiveTab] = useState("featured");
  
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
              <div className="absolute -top-4 -right-4 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                Yeni
              </div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1e355d] to-[#4fc3f7] flex items-center justify-center text-white">
                  <Brain size={20} />
                </div>
                <h3 className="ml-3 text-xl font-bold text-[#1e355d]">Rüya Asistanı</h3>
              </div>
              <p className="text-[#2a406c] mb-4">"Dün gece uçtuğumu ve yüksek bir dağın üzerinde süzüldüğümü gördüm..."</p>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-[#1e355d] font-medium">Rüyanız özgürlük ve yeni bakış açıları kazanma arzunuzu yansıtıyor. Yükseklik, hayatınızdaki geniş perspektifi temsil ediyor.</p>
              </div>
              <div className="mt-4 flex justify-end">
                <Badge className="bg-gradient-to-r from-[#1e355d] to-[#4fc3f7]">
                  <Sparkles className="mr-1 h-3 w-3" /> AI Yorumu
                </Badge>
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
                  "Hayallerin sınırı yoktur, sadece senin cesaretin var."
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
          
          <TabsContent value="featured" className="mt-0">
            {loadingPopular ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : popularDreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularDreams.map((dream) => (
                  <motion.div 
                    key={dream.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <DreamCard dream={dream} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-md">
                <p className="text-[#2a406c] font-medium">Henüz popüler rüya bulunmuyor.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentUser ? (
              myDreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myDreams.map((dream) => (
                    <motion.div 
                      key={dream.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <DreamCard dream={dream} onDelete={handleDeleteDream} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-md">
                  <p className="text-[#2a406c] font-medium">Henüz rüya kaydetmediniz.</p>
                  <Link to="/create-dream">
                    <Button className="mt-4 bg-gradient-to-r from-[#1e355d] to-[#4fc3f7] hover:from-[#2a406c] hover:to-[#81d4fa]">
                      İlk Rüyanı Kaydet
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="text-center py-8 bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-md">
                <p className="text-[#2a406c] font-medium">Rüyalarını görmek için giriş yap.</p>
                <Link to="/login">
                  <Button className="mt-4 bg-gradient-to-r from-[#1e355d] to-[#4fc3f7] hover:from-[#2a406c] hover:to-[#81d4fa]">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
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
