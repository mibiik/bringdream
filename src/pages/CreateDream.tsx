import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";
import { DreamInterpretation } from "@/components/dream-interpretation";

const CreateDream = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Oturum açmanız gerekiyor.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error("Başlık ve rüya metni ekleyin.");
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      const dreamRef = await addDoc(collection(db, "dreams"), {
        title,
        content,
        isPrivate,
        createdAt: new Date(),
        userId: currentUser.uid,
        userName: userData.displayName || "Kullanıcı",
        userAvatar: userData.photoURL || null,
        userUsername: userData.username || null,
        likes: 0,
        comments: 0
      });
      toast.success("Rüyanız başarıyla kaydedildi!");
      navigate(`/dream/${dreamRef.id}`);
    } catch (error) {
      console.error("Dream creation error:", error);
      toast.error("Rüya kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Yeni Rüya Ekle</h1>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Rüya Başlığı</Label>
                <Input
                  id="title"
                  placeholder="Rüyanızın kısa bir başlığını yazın"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Rüya İçeriği</Label>
                <Textarea
                  id="content"
                  placeholder="Rüyanızı detaylı bir şekilde yazın..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private" className="cursor-pointer">
                    Bu rüyayı sadece ben görebilirim
                  </Label>
                </div>
              </div>

              {content.length > 10 && (
                <div className="mt-4">
                  <DreamInterpretation dreamContent={content} />
                </div>
              )}
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Rüyayı Kaydet"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {showInterpretation && content.length > 10 && (
          <DreamInterpretation dreamContent={content} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateDream;
