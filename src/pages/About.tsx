// Daha gelişmiş, etkileşimli ve örnekli bir About sayfası
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Users, MessageCircle, Star, Lightbulb, ChevronDown } from "lucide-react";

const EXAMPLES = [
  {
    title: "Rüya Paylaşım Örneği",
    content: "Gece bir ormanda kaybolduğumu gördüm ve gökyüzünde parlak bir yıldız vardı. Bu ne anlama geliyor?",
    ai: "Bu rüya, bilinçaltınızda yeni bir yolculuğa çıkma arzunuzu ve umutlarınızı simgeliyor olabilir. Yıldız, rehberlik ve umut anlamı taşır!"
  },
  {
    title: "AI Yorumlama Örneği",
    content: "Bir aslanla konuştuğumu gördüm. Korkmuyordum, aksine huzurluydum.",
    ai: "Rüyanızda aslan, içsel gücünüzü ve özgüveninizi temsil edebilir. Huzur hissetmeniz, bu gücü kabullendiğiniz anlamına gelir."
  },
  {
    title: "Topluluk Etkileşimi",
    content: "Bir kullanıcı rüyanıza yorum yaptı: 'Ben de benzer bir rüya gördüm, çok ilginç!'",
    ai: "Toplulukta benzer deneyimleri paylaşmak, kendinizi daha iyi anlamanıza yardımcı olur."
  },
];

export default function About() {
  const [showExamples, setShowExamples] = useState(false);
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-2xl">
        <CardHeader className="flex flex-col items-center gap-2 pb-0">
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="h-12 w-12 text-blue-500 animate-pulse" />
            <CardTitle className="text-4xl font-extrabold text-blue-800 tracking-tight text-center drop-shadow">Daha Fazla Öğren & İlham Al</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <section className="mb-6 text-center">
            <p className="text-lg text-gray-700 mb-2">
              <span className="font-bold">Bring</span> ile rüyalarını paylaş, toplulukla etkileşime geç ve <span className="text-blue-600 font-semibold">yapay zeka</span> ile rüyalarını farklı açılardan analiz et!
            </p>
            <p className="text-base text-gray-500">
              Kendi rüya yolculuğunu başlatmak için örnekleri incele, deneyimleri keşfet ve ilham al.
            </p>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="flex flex-col items-center">
              <BookOpen className="h-9 w-9 text-indigo-400 mb-1" />
              <span className="font-semibold text-indigo-700">Yapay Zeka Yorumları</span>
              <p className="text-xs text-gray-500 mt-1 text-center">Rüyanı farklı bakış açılarıyla analiz eden güçlü AI yorumlama modları.</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-9 w-9 text-pink-400 mb-1" />
              <span className="font-semibold text-pink-700">Topluluk ve Etkileşim</span>
              <p className="text-xs text-gray-500 mt-1 text-center">Rüyalarına yorum yap, beğen, paylaş ve başkalarıyla bağlantı kur.</p>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="h-9 w-9 text-green-400 mb-1" />
              <span className="font-semibold text-green-700">Gizlilik ve Güvenlik</span>
              <p className="text-xs text-gray-500 mt-1 text-center">Rüyalarını gizli veya herkese açık paylaş, kontrol daima sende!</p>
            </div>
          </div>

          {/* İlham ve örnekler bölümü */}
          <div className="mt-10 flex flex-col items-center">
            <Button
              onClick={() => setShowExamples((v) => !v)}
              variant="outline"
              size="lg"
              className="rounded-full px-6 py-2 flex items-center gap-2 shadow hover:bg-blue-50"
            >
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              İlham Al & Örnekleri Gör
              <ChevronDown className={`h-5 w-5 transition-transform ${showExamples ? "rotate-180" : ""}`} />
            </Button>
            {showExamples && (
              <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXAMPLES.map((ex, i) => (
                  <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="font-semibold text-blue-700 text-sm">{ex.title}</span>
                    </div>
                    <div className="text-xs text-gray-600 italic">{ex.content}</div>
                    <div className="text-xs text-green-700 border-l-4 border-green-200 pl-2 mt-1">{ex.ai}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center">
            <Button asChild size="lg" className="bg-blue-600 text-white rounded-full px-8 py-2 shadow-lg hover:bg-blue-700">
              <a href="/Register">Keşfetmeye Başla</a>
            </Button>
            <p className="text-xs text-gray-400 mt-2">Soruların için: <a href="mailto:destek@bring.app" className="underline text-blue-500">destek@bring.app</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
