import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <nav className="w-full px-4 py-3 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md fixed top-0 z-50">
      <div className="flex items-center gap-2">
        <Link to="/">
          <img src="/vvvvv.png" alt="Logo" className="h-10 w-auto" style={{maxWidth: 160}} />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="bg-blue-100 hover:bg-blue-900 text-blue-800">
            Giriş Yap
          </Button>
        </Link>
        <Link to="/register">
          <Button variant="default" size="sm" className="navy-dark hover:bg-navy-dark text-white transition-all duration-300 hover:scale-105 hover:shadow-md">
            Kayıt Ol
          </Button>
        </Link>
      </div>
    </nav>
  );
}
