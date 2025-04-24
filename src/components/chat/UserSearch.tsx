import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface User {
  id: string;
  displayName: string;
  photoURL?: string;
  username?: string;
}

interface UserSearchProps {
  onSelectUser: (userId: string, userName: string) => void;
}

export const UserSearch = ({ onSelectUser }: UserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const searchUsers = async () => {
    if (!searchTerm.trim() || !currentUser) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const displayNameQuery = query(
        usersRef,
        where("displayName", ">=", searchTerm.toLowerCase()),
        where("displayName", "<=", searchTerm.toLowerCase() + "\uf8ff")
      );
      const usernameQuery = query(
        usersRef,
        where("username", ">=", searchTerm.toLowerCase()),
        where("username", "<=", searchTerm.toLowerCase() + "\uf8ff")
      );

      const [displayNameSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(displayNameQuery),
        getDocs(usernameQuery)
      ]);

      const searchResults = new Map<string, User>();

      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          if (doc.id !== currentUser.uid && !searchResults.has(doc.id)) {
            searchResults.set(doc.id, {
              id: doc.id,
              ...doc.data() as User
            });
          }
        });
      };

      processSnapshot(displayNameSnapshot);
      processSnapshot(usernameSnapshot);

      setUsers(Array.from(searchResults.values()));
    } catch (error) {
      console.error("Kullanıcı arama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  return (
    <div className="p-4 border-b bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchUsers()}
            className="pl-10 w-full bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <Button
          onClick={searchUsers}
          disabled={loading}
          size="icon"
          variant="ghost"
          className="shrink-0"
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {users.length > 0 && (
        <div className="mt-4 space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-2">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user.id, user.displayName)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/80 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-100"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center text-primary font-medium shadow-sm border-2 border-white">
                  {user.displayName[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.displayName}</p>
                {user.username && (
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};