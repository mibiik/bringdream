import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { interpretDream } from "@/lib/gemini";
import { DreamInterpretationMode } from "@/lib/gemini";
import { toast } from "@/components/ui/sonner";

interface DreamInterpretationProps {
  dreamContent: string;
  commentCount?: number;
}

const MODES: { label: string; value: DreamInterpretationMode }[] = [
  { label: "Klasik", value: "klasik" },
  { label: "Olumlu", value: "olumlu" },
  { label: "Kabus/Uyarı", value: "kabus" },
  { label: "Freud (Psikanaliz)", value: "freud" },
  { label: "Jung (Arketipsel)", value: "jung" },
  { label: "Arabi (Tasavvufi)", value: "arabi" },
  { label: "Modern Yorumcu", value: "modern" },
  { label: "Kısa & Net", value: "kisa" },
];

export function DreamInterpretation({ dreamContent, commentCount }: DreamInterpretationProps) {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<DreamInterpretationMode>("klasik");

  // Bildirim fonksiyonu
  // Bildirim süresi daha kısa (hızlı) olacak şekilde ayarlandı
  const showToast = (msg: string) => {
    toast(msg, { duration: 900, position: "top-center" });
  };

  const getInterpretation = async () => {
    setLoading(true);
    try {
      const result = await interpretDream(dreamContent, mode);
      setInterpretation(result);
      showToast("Rüya başarıyla yorumlandı!");
    } catch (error) {
      console.error("Error interpreting dream:", error);
      showToast("Yorumlama sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/50 bg-primary/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Rüya Yorumu</CardTitle>
        </div>
        <CardDescription>
          Sihirli Yorumlama ile rüyanı farklı bakış açılarıyla analiz et, paylaş ve beğen!
        </CardDescription>
        {typeof commentCount === 'number' && (
          <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square h-4 w-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span>{commentCount} yorum</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Button
              key={m.value}
              size="sm"
              variant={mode === m.value ? "default" : "outline"}
              className="text-xs"
              onClick={() => setMode(m.value)}
              disabled={loading}
            >
              {m.label}
            </Button>
          ))}
        </div>
        {interpretation ? (
          <p className="text-sm leading-relaxed">{interpretation}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Rüyanızın yorumunu görmek için aşağıdaki butona tıklayın.
          </p>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4 text-xs"
          onClick={getInterpretation}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Yorumlanıyor...
            </>
          ) : interpretation ? "Yeniden Yorumla" : "Rüyamı Yorumla"}
        </Button>
      </CardContent>
    </Card>
  );
}
