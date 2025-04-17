import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { registerUser } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

function validateUsername(username: string): string | null {
  if (!username) return "Kullanıcı adı boş olamaz.";
  if (!/^[a-z0-9_]{3,16}$/.test(username)) return "Kullanıcı adı 3-16 karakter, küçük harf, rakam ve alt çizgi içerebilir.";
  return null;
}

const Register = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Kullanıcı adı canlı kontrol
  function handleUsernameChange(val: string) {
    setUsername(val.toLowerCase());
    const err = validateUsername(val.toLowerCase());
    setUsernameError(err);
    if (err) return;
    setCheckingUsername(true);
    setTimeout(async () => {
      const q = query(collection(db, "users"), where("username", "==", val.toLowerCase()));
      const docs = await getDocs(q);
      if (!docs.empty) setUsernameError("Bu kullanıcı adı alınmış.");
      else setUsernameError(null);
      setCheckingUsername(false);
    }, 600);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor!");
      return;
    }
    if (usernameError || !username) {
      toast.error(usernameError || "Kullanıcı adı zorunlu!");
      return;
    }
    setLoading(true);
    try {
      const user = await registerUser(email, password);
      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        username,
        email: user.email,
        createdAt: new Date(),
        photoURL: null,
        bio: "",
        dreamCount: 0,
        followerCount: 0,
        followingCount: 0
      });
      toast.success("Hesabınız başarıyla oluşturuldu!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Kayıt oluşturulamadı: " + error.message);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-md mx-auto">
        <Card className="border border-border/50 bg-background/80 backdrop-blur-sm shadow-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Moon className="h-10 w-10 text-primary animate-pulse-gentle" />
            </div>
            <CardTitle className="text-2xl">Rüya Dünyasına Kayıt</CardTitle>
            <CardDescription>
              Rüyalarınızı kaydetmek ve paylaşmak için hesap oluşturun
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Ad Soyad
                </label>
                <Input
                  id="name"
                  placeholder="Adınız Soyadınız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Kullanıcı Adı
                </label>
                <Input
                  id="username"
                  placeholder="kullaniciadi"
                  value={username}
                  maxLength={16}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                />
                {checkingUsername && <span className="text-xs text-blue-500">Kontrol ediliyor...</span>}
                {usernameError && <span className="text-xs text-red-500">{usernameError}</span>}
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@ornek.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Şifre Tekrar
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading || !!usernameError}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Kayıt Ol"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Hesabınız var mı? <Link to="/login" className="underline">Giriş Yap</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
