import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { logoutUser } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";
import { Home, PlusCircle, Compass, User, LogOut, MessageSquare } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Başarıyla çıkış yapıldı!");
      navigate("/");
    } catch (error) {
      toast.error("Çıkış yapılırken bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Top Navigation */}
      <nav className="w-full px-4 py-3 flex items-center justify-between border-b border-border/40 bg-background/90 backdrop-blur-md fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img src="/vvvvv.png" alt="Logo" className="h-10 w-auto" style={{maxWidth: 160}} />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Çıkış butonu sadece profil sayfasında ve sadece masaüstünde gösterilecek, minimalist */}
          {currentUser && window.location.pathname.startsWith("/profile") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full p-2 hover:bg-red-50"
              title="Çıkış Yap"
              aria-label="Çıkış Yap"
            >
              <LogOut className="h-5 w-5 text-red-400" />
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full bg-background/90 backdrop-blur-md border-t border-border/40 md:hidden">
        <div className="grid h-16 grid-cols-5 mx-auto font-medium">
          <Link to="/dashboard" className="flex flex-col items-center justify-center px-4 py-2">
            <Home className="w-5 h-5 text-primary" />
            <span className="text-xs mt-1">Ana Sayfa</span>
          </Link>
          <Link to="/create-dream" className="flex flex-col items-center justify-center px-4 py-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            <span className="text-xs mt-1">Yeni Rüya</span>
          </Link>
          <Link to="/discover" className="flex flex-col items-center justify-center px-4 py-2">
            <Compass className="w-5 h-5 text-primary" />
            <span className="text-xs mt-1">Keşfet</span>
          </Link>
          <Link to="/messages" className="flex flex-col items-center justify-center px-4 py-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-xs mt-1">Mesajlar</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center px-4 py-2">
            <User className="w-5 h-5 text-primary" />
            <span className="text-xs mt-1">Profil</span>
          </Link>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 border-r border-border/40 bg-background/90 backdrop-blur-md pt-20 hidden md:block">
        <div className="flex flex-col space-y-2 p-4">
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-5 w-5" />
              Ana Sayfa
            </Button>
          </Link>
          <Link to="/create-dream">
            <Button variant="ghost" className="w-full justify-start">
              <PlusCircle className="mr-2 h-5 w-5" />
              Yeni Rüya
            </Button>
          </Link>
          <Link to="/discover">
            <Button variant="ghost" className="w-full justify-start">
              <Compass className="mr-2 h-5 w-5" />
              Keşfet
            </Button>
          </Link>
          <Link to="/messages">
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="mr-2 h-5 w-5" />
              Mesajlar
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-5 w-5" />
              Profil
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-6 pt-16 md:pl-64">
        <div className="container mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
