
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { loginUser } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await loginUser(email, password);
      toast.success("Başarıyla giriş yapıldı!");
      navigate("/dashboard"); // Redirect to the dashboard after login
    } catch (error: any) {
      toast.error("Giriş yapılamadı: " + error.message);
      console.error("Login error:", error);
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
            <CardTitle className="text-2xl">Rüya Dünyasına Giriş</CardTitle>
            <CardDescription>
              Rüyalarınıza erişmek için giriş yapın
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-posta
                </label>
                <Input
                  id="email"
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Hesabınız yok mu?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Kayıt ol
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
