import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Edit2, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { doc, getDoc, updateDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";
import { logoutUser } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { ExtendedProfileForm } from "@/components/extended-profile-form";

interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  photoURL: string | null;
  dreamCount: number;
  followerCount: number;
  followingCount: number;
  profileCompleted?: boolean;
}

function validateUsername(username: string): string | null {
  if (!username) return "Kullanıcı adı boş olamaz.";
  if (!/^[a-z0-9_]{3,16}$/.test(username)) return "Kullanıcı adı 3-16 karakter, küçük harf, rakam ve alt çizgi içerebilir.";
  return null;
}

const Profile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [photoFile, setPhotoFile] = useState<File|null>(null);
  const [showExtendedForm, setShowExtendedForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            displayName: userData.displayName || "Kullanıcı",
            username: userData.username || "",
            bio: userData.bio || "",
            photoURL: userData.photoURL,
            dreamCount: userData.dreamCount || 0,
            followerCount: userData.followerCount || 0,
            followingCount: userData.followingCount || 0,
            profileCompleted: userData.profileCompleted || false
          });
          if (!userData.profileCompleted) {
            setShowExtendedForm(true);
          }
          setDisplayName(userData.displayName || "");
          setUsername(userData.username || "");
          setBio(userData.bio || "");
        } else {
          // Create default profile if it doesn't exist
          const defaultProfile = {
            displayName: currentUser.displayName || "Kullanıcı",
            username: "",
            email: currentUser.email,
            bio: "",
            photoURL: null,
            createdAt: new Date(),
            dreamCount: 0,
            followerCount: 0,
            followingCount: 0
          };
          await setDoc(userDocRef, defaultProfile);
          setProfile(defaultProfile);
          setDisplayName(defaultProfile.displayName);
          setUsername(defaultProfile.username);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Profil bilgileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  // Kullanıcı adı değiştikçe benzersizliğini kontrol et
  useEffect(() => {
    if (!username) return;
    setUsernameError(validateUsername(username));
    if (validateUsername(username)) return;
    setCheckingUsername(true);
    const check = setTimeout(async () => {
      // Aynı username başka biri tarafından alınmış mı?
      const q = query(collection(db, "users"), where("username", "==", username));
      const docs = await getDocs(q);
      if (!docs.empty && docs.docs[0].id !== currentUser?.uid) setUsernameError("Bu kullanıcı adı alınmış.");
      else setUsernameError(null);
      setCheckingUsername(false);
    }, 600);
    return () => clearTimeout(check);
  }, [username, currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    if (usernameError) return toast.error(usernameError);
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        displayName,
        username,
        bio
      }, { merge: true });
      setProfile(prev => prev ? { ...prev, displayName, username, bio } : prev);
      toast.success("Profil başarıyla güncellendi.");
      setEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/login";
    } catch (error) {
      toast.error("Çıkış yapılamadı. Lütfen tekrar deneyin.");
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setPhotoFile(file);
    setLoading(true);
    try {
      const storageRef = ref(storage, `profile_photos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", currentUser.uid), { photoURL: url });
      setProfile((prev) => prev ? { ...prev, photoURL: url } : prev);
      toast.success("Profil fotoğrafı güncellendi!");
    } catch (error) {
      toast.error("Fotoğraf yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setShowExtendedForm(false);
    setProfile(prev => prev ? { ...prev, profileCompleted: true } : null);
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-md mx-auto px-2 md:px-0 py-8 flex flex-col gap-6">
        {showExtendedForm && currentUser ? (
          <ExtendedProfileForm
            userId={currentUser.uid}
            onComplete={handleProfileComplete}
          />
        ) : (
          <>
            {/* Çıkış butonu minimalist, sağ üstte, sadece ikon */}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-red-50 transition"
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut className="h-5 w-5 text-red-400" />
              </button>
            )}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
                <section className="bg-white/90 shadow-xl rounded-2xl p-6 flex flex-col items-center gap-6 border border-gray-100">
                  {/* Profil Fotoğrafı */}
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={profile?.photoURL || undefined} />
                <AvatarFallback>{displayName.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            {/* İsim ve Kullanıcı Adı */}
            <div className="text-center flex flex-col gap-1">
              <span className="text-xl font-semibold text-gray-900 tracking-tight">{profile?.displayName}</span>
              <span className="text-sm text-gray-400 font-mono">@{profile?.username}</span>
            </div>
            {/* Bio */}
            <p className="text-gray-600 text-sm text-center max-w-xs">
              {profile?.bio || <span className="italic text-gray-300">Kendini tanıtarak topluluğa katıl!</span>}
            </p>
            {/* İstatistikler */}
            <div className="flex justify-center gap-8 w-full">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-primary">{profile?.dreamCount}</span>
                <span className="text-xs text-gray-400">Rüya</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-primary">{profile?.followerCount}</span>
                <span className="text-xs text-gray-400">Takipçi</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-primary">{profile?.followingCount}</span>
                <span className="text-xs text-gray-400">Takip</span>
              </div>
            </div>
            {/* Düzenle butonu minimalist */}
            <div className="w-full flex justify-center">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition font-medium"
                >
                  Profili Düzenle
                </button>
              ) : (
                <form className="w-full flex flex-col gap-3" onSubmit={e => { e.preventDefault(); handleSaveProfile(); }}>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="İsminiz"
                    className="text-center"
                  />
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase())}
                    placeholder="kullaniciadi"
                    maxLength={16}
                    className="text-center"
                  />
                  {checkingUsername && <span className="text-xs text-blue-500 text-center">Kontrol ediliyor...</span>}
                  {usernameError && <span className="text-xs text-red-500 text-center">{usernameError}</span>}
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Kısa bir bio yazın"
                    rows={2}
                    className="text-center"
                  />
                  <div className="flex gap-2 mt-2 justify-center">
                    <Button type="submit" disabled={loading || !!usernameError} size="sm" className="rounded-full px-4">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Kaydet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => {
                        setEditing(false);
                        setDisplayName(profile?.displayName || "");
                        setUsername(profile?.username || "");
                        setBio(profile?.bio || "");
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              )}
            </div>
                </section>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    );
};

export default Profile;
