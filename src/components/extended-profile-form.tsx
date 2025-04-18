import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";

interface ExtendedProfileFormProps {
  userId: string;
  onComplete: () => void;
}

interface ExtendedProfileData {
  gender: string;
  age: string;
  occupation: string;
  interests: string;
  dreamPreferences: string;
  personalityTraits: string;
}

export const ExtendedProfileForm = ({ userId, onComplete }: ExtendedProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExtendedProfileData>({
    gender: "",
    age: "",
    occupation: "",
    interests: "",
    dreamPreferences: "",
    personalityTraits: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        extendedProfile: formData,
        profileCompleted: true,
      });
      toast.success("Profil bilgileriniz başarıyla kaydedildi!");
      onComplete();
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      toast.error("Profil bilgileri kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Profilinizi Tamamlayın
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gender">Cinsiyet</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cinsiyet seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Erkek</SelectItem>
                <SelectItem value="female">Kadın</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Yaş</Label>
            <Input
              id="age"
              type="number"
              min="13"
              max="120"
              value={formData.age}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, age: e.target.value }))
              }
              placeholder="Yaşınızı giriniz"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Meslek</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, occupation: e.target.value }))
              }
              placeholder="Mesleğinizi giriniz"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">İlgi Alanları</Label>
            <Textarea
              id="interests"
              value={formData.interests}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, interests: e.target.value }))
              }
              placeholder="İlgi alanlarınızı giriniz (örn: kitap okuma, spor, müzik)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dreamPreferences">
              Rüya Tercihleri ve Deneyimleri
            </Label>
            <Textarea
              id="dreamPreferences"
              value={formData.dreamPreferences}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dreamPreferences: e.target.value,
                }))
              }
              placeholder="Rüyalarınızla ilgili deneyimlerinizi ve tercihlerinizi paylaşın"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalityTraits">Kişilik Özellikleri</Label>
            <Textarea
              id="personalityTraits"
              value={formData.personalityTraits}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  personalityTraits: e.target.value,
                }))
              }
              placeholder="Kendinizi nasıl tanımlarsınız? (örn: sakin, enerjik, yaratıcı)"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Kaydediliyor..." : "Profili Tamamla"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};