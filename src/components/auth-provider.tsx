
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Redirect logic
      if (user) {
        const protectedPages = ["/login", "/register"];
        if (protectedPages.includes(window.location.pathname)) {
          navigate("/dashboard");
        }
      } else {
        const authRequiredPages = ["/dashboard", "/profile", "/create-dream"];
        if (authRequiredPages.includes(window.location.pathname)) {
          navigate("/login");
        }
      }
    });

    return unsubscribe;
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
