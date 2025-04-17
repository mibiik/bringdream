import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { toast } from "@/components/ui/sonner";

const EditDream = () => {
  const { dreamId } = useParams<{ dreamId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDream = async () => {
      if (!dreamId) return;
      try {
        const dreamDocRef = doc(db, "dreams", dreamId);
        const dreamDoc = await getDoc(dreamDocRef);
        if (dreamDoc.exists()) {
          const data = dreamDoc.data();
          if (data.userId !== currentUser?.uid) {
            toast.error("Bu rüyayı düzenleme yetkiniz yok.");
            navigate(-1);
            return;
          }
          setTitle(data.title);
          setContent(data.content);
        } else {
          toast.error("Rüya bulunamadı.");
          navigate(-1);
        }
      } catch (error) {
        toast.error("Rüya yüklenirken hata oluştu.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchDream();
  }, [dreamId, currentUser, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamId || !title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const dreamDocRef = doc(db, "dreams", dreamId);
      await updateDoc(dreamDocRef, { title, content });
      toast.success("Rüya başarıyla güncellendi");
      navigate(`/dream/${dreamId}`);
    } catch (error) {
      toast.error("Güncelleme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="py-12 text-center">Yükleniyor...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>Rüyayı Düzenle</CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Rüya başlığı"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <Textarea
                className="w-full"
                rows={8}
                placeholder="Rüya içeriği"
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Vazgeç</Button>
                <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditDream;
