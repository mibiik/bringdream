import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Link } from "react-router-dom";
import { DreamCard } from "@/components/dream-card";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

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

const Dashboard = () => {
  const [myDreams, setMyDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDreams = async () => {
      if (!currentUser) return;

      try {
        const dreamsQuery = query(
          collection(db, "dreams"),
          where("userId", "==", currentUser.uid),
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
              id: data.userId || "",
              name: data.userName || "Kullanıcı",
              avatar: data.userAvatar || "",
            }
          };
        });
        
        setMyDreams(dreamsList);
      } catch (error) {
        console.error("Dreams fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDreams();
  }, [currentUser]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rüya Günlüğüm</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tüm Rüyalarım</TabsTrigger>
            <TabsTrigger value="public">Herkese Açık</TabsTrigger>
            <TabsTrigger value="private">Sadece Ben</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myDreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDreams.map((dream) => (
                  <div key={dream.id}>
                    <DreamCard dream={dream} onDelete={(id) => setMyDreams(myDreams.filter(d => d.id !== id))} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                Henüz rüya kaydetmediniz. İlk rüyanızı kaydetmek için "Yeni Rüya" butonuna tıklayın.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="public" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myDreams.filter(d => !d.isPrivate).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDreams.filter(d => !d.isPrivate).map((dream) => (
                  <div key={dream.id}>
                    <DreamCard dream={dream} onDelete={(id) => setMyDreams(myDreams.filter(d => d.id !== id))} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                Henüz herkese açık rüya paylaşmadınız.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="private" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myDreams.filter(d => d.isPrivate).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDreams.filter(d => d.isPrivate).map((dream) => (
                  <div key={dream.id}>
                    <DreamCard dream={dream} onDelete={(id) => setMyDreams(myDreams.filter(d => d.id !== id))} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                Henüz özel rüya kaydetmediniz.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
