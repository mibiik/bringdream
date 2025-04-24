import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DreamCard } from "@/components/dream-card";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Loader2, MessageSquare, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FollowButton } from "@/components/FollowButton";

interface UserData {
  displayName: string;
  username: string;
  photoURL: string | null;
  bio: string;
  createdAt: Date;
  followerCount: number;
  followingCount: number;
}

interface Dream {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isPrivate: boolean;
  likes: number;
  comments: number;
  user: {
    name: string;
    avatar: string;
  };
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followers, setFollowers] = useState<{uid: string, displayName: string, username: string, photoURL: string|null}[]>([]);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [following, setFollowing] = useState<{uid: string, displayName: string, username: string, photoURL: string|null}[]>([]);
  const [profileUid, setProfileUid] = useState<string|null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        // Önce UID mi, username mi kontrol et
        let userDocSnap = null;
        let realUid = userId;
        const q = query(collection(db, "users"), where("username", "==", userId));
        const docsSnap = await getDocs(q);
        if (!docsSnap.empty) {
          userDocSnap = docsSnap.docs[0];
          realUid = userDocSnap.id;
        } else {
          userDocSnap = await getDoc(doc(db, "users", userId));
          if (!userDocSnap.exists()) return setUserData(null);
        }
        setProfileUid(realUid); // UID'yi kaydet
        const data = userDocSnap.data();
        setUserData({
          displayName: data.displayName || "Kullanıcı",
          username: data.username || userId,
          photoURL: data.photoURL || null,
          bio: data.bio || "Bu kullanıcı henüz bir biyografi eklememiş.",
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          followerCount: data.followerCount || 0,
          followingCount: data.followingCount || 0
        });
        if (currentUser && realUid !== currentUser.uid) {
          // Takip durumu kontrolü
          const { isFollowing } = await import("@/lib/follow");
          setIsFollowing(await isFollowing(currentUser.uid, realUid));
        }
        // Fetch user's public dreams
        const dreamsQuery = query(
          collection(db, "dreams"),
          where("userId", "==", realUid),
          where("isPrivate", "==", false),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(dreamsQuery);
        const dreamsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            createdAt: new Date(data.createdAt.toDate()).toLocaleDateString("tr-TR"),
            isPrivate: data.isPrivate,
            likes: data.likes || 0,
            comments: data.comments || 0,
            user: {
              name: data.userName || "Kullanıcı",
              avatar: data.userAvatar || ""
            }
          };
        });
        setDreams(dreamsList);
      } catch {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, currentUser]);

  const startConversation = () => {
    if (!currentUser || !profileUid || !userData) return;
    navigate('/messages');
    // Mesajlar sayfasına yönlendirdikten sonra seçili kullanıcıyı ayarla
    setTimeout(() => {
      const event = new CustomEvent('startChat', {
        detail: {
          userId: profileUid,
          userName: userData.displayName
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  // Takip/Çık fonksiyonları
  const handleFollow = async () => {
    if (!currentUser || !profileUid) return;
    setFollowLoading(true);
    try {
      const { followUser } = await import("@/lib/follow");
      await followUser(currentUser.uid, profileUid);
      setIsFollowing(true);
      setUserData((prev) => prev ? { ...prev, followerCount: (prev.followerCount || 0) + 1 } : prev);
    } catch (e: any) {
      toast.error(e.message || "Takip edilemedi");
    } finally {
      setFollowLoading(false);
    }
  };
  const handleUnfollow = async () => {
    if (!currentUser || !profileUid) return;
    setFollowLoading(true);
    try {
      const { unfollowUser } = await import("@/lib/follow");
      await unfollowUser(currentUser.uid, profileUid);
      setIsFollowing(false);
      setUserData((prev) => prev ? { ...prev, followerCount: (prev.followerCount || 1) - 1 } : prev);
    } catch (e: any) {
      toast.error(e.message || "Takipten çıkılamadı");
    } finally {
      setFollowLoading(false);
    }
  };

  // Takipçileri getir (UID ile tek tek çek)
  const fetchFollowers = async () => {
    if (!profileUid) return;
    setFollowers([]);
    setFollowersOpen(true);
    try {
      const userSnap = await getDoc(doc(db, "users", profileUid));
      const fids: string[] = userSnap.exists() && Array.isArray(userSnap.data().followers) ? userSnap.data().followers : [];
      if (fids.length === 0) return;
      // Her UID için tek tek kullanıcıları çek
      const userDocs = await Promise.all(
        fids.slice(0, 20).map(uid => getDoc(doc(db, "users", uid)))
      );
      setFollowers(userDocs.filter(d => d.exists()).map(d => ({
        uid: d.id,
        displayName: d.data().displayName || "Kullanıcı",
        username: d.data().username || d.id,
        photoURL: d.data().photoURL || null
      })));
    } catch {}
  };
  // Takip edilenleri getir (UID ile tek tek çek)
  const fetchFollowing = async () => {
    if (!profileUid) return;
    setFollowing([]);
    setFollowingOpen(true);
    try {
      const userSnap = await getDoc(doc(db, "users", profileUid));
      const fids: string[] = userSnap.exists() && Array.isArray(userSnap.data().following) ? userSnap.data().following : [];
      if (fids.length === 0) return;
      const userDocs = await Promise.all(
        fids.slice(0, 20).map(uid => getDoc(doc(db, "users", uid)))
      );
      setFollowing(userDocs.filter(d => d.exists()).map(d => ({
        uid: d.id,
        displayName: d.data().displayName || "Kullanıcı",
        username: d.data().username || d.id,
        photoURL: d.data().photoURL || null
      })));
    } catch {}
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p>Kullanıcı bulunamadı.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30" />
          <CardContent className="pt-0">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={userData?.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-xl">
                  <User className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                {userData?.displayName}
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">@{userData?.username}</span>
              </h2>
              <div className="flex gap-6 py-2">
                <button 
                  className="flex flex-col items-center group transition-all hover:scale-105" 
                  onClick={fetchFollowers}
                >
                  <span className="text-lg font-bold text-primary group-hover:underline">
                    {userData?.followerCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-primary/80 transition-colors">
                    Takipçi
                  </span>
                </button>
                <button 
                  className="flex flex-col items-center group transition-all hover:scale-105" 
                  onClick={fetchFollowing}
                >
                  <span className="text-lg font-bold text-primary group-hover:underline">
                    {userData?.followingCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-primary/80 transition-colors">
                    Takip
                  </span>
                </button>
              </div>
              {/* Takip/Çık butonu (kendin değilse) */}
              {currentUser && profileUid !== currentUser.uid && (
                <div className="flex gap-2 mt-2">
                  {isFollowing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={followLoading}
                      onClick={handleUnfollow}
                    >
                      Takipten Çık
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={followLoading}
                      onClick={handleFollow}
                    >
                      Takip Et
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/messages/${profileUid}`)}
                  >
                    Mesaj Gönder
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Hakkında</h2>
              <p>{userData.bio}</p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Paylaşılan Rüyalar</h2>
          {dreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dreams.map((dream) => (
                <DreamCard key={dream.id} dream={dream} />
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Bu kullanıcı henüz rüya paylaşmamış.
            </p>
          )}
        </div>
      </div>
      {/* Takipçiler Dialog */}
      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent aria-describedby="followers-desc">
          <DialogHeader>
            <DialogTitle>Takipçiler</DialogTitle>
          </DialogHeader>
          <div id="followers-desc" className="space-y-2 max-h-72 overflow-y-auto">
            {followers.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">Takipçi yok</div>
            ) : (
              followers.map(f => (
                <div key={f.uid} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={f.photoURL || undefined} />
                    <AvatarFallback>{f.displayName.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.displayName}</div>
                    <div className="text-xs text-gray-400 truncate">@{f.username}</div>
                  </div>
                  {/* Takip et/çık butonu ve mesaj gönder butonu */}
                  {currentUser && f.uid !== currentUser.uid && (
                    <div className="flex gap-2">
                      {/* Takip et/çık butonu */}
                      <FollowButton targetUid={f.uid} />
                      {/* Mesaj gönder butonu */}
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/messages/${f.uid}`)}>
                        Mesaj Gönder
                      </Button>
                    </div>
                  )}
                  {currentUser && f.uid === currentUser.uid && (
                    <span className="text-xs text-green-600 font-semibold ml-2">(Sen)</span>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Takip edilenler Dialog */}
      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent aria-describedby="following-desc">
          <DialogHeader>
            <DialogTitle>Takip Edilenler</DialogTitle>
          </DialogHeader>
          <div id="following-desc" className="space-y-2 max-h-72 overflow-y-auto">
            {following.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">Takip edilen yok</div>
            ) : (
              following.map(f => (
                <div key={f.uid} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={f.photoURL || undefined} />
                    <AvatarFallback>{f.displayName.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.displayName}</div>
                    <div className="text-xs text-gray-400 truncate">@{f.username}</div>
                  </div>
                  {/* Takip et/çık butonu ve mesaj gönder butonu */}
                  {currentUser && f.uid !== currentUser.uid && (
                    <div className="flex gap-2">
                      {/* Takip et/çık butonu */}
                      <FollowButton targetUid={f.uid} />
                      {/* Mesaj gönder butonu */}
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/messages/${f.uid}`)}>
                        Mesaj Gönder
                      </Button>
                    </div>
                  )}
                  {currentUser && f.uid === currentUser.uid && (
                    <span className="text-xs text-green-600 font-semibold ml-2">(Sen)</span>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserProfile;
