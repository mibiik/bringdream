import { useState } from "react";
import { DreamCard } from "./dream-card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Hash, RefreshCw } from "lucide-react";

// Demo veri: Flood (zincir) ve hashtag'li rüyalar
const demoDreams = [
  {
    id: "1",
    title: "Rüyamda uçuyordum! #özgürlük #uçmak",
    content: "Bir ormanda kanatlarım vardı ve gökyüzünde süzülüyordum. Çok huzurluydu! #özgürlük #rüya",
    createdAt: "5dk önce",
    isPrivate: false,
    likes: 8,
    comments: 2,
    user: { id: "u1", name: "Ayşe", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
    hashtags: ["özgürlük","uçmak","rüya"],
    flood: [
      "Birdenbire kendimi gökyüzünde buldum.",
      "Aşağıda ormanlar, dağlar vardı.",
      "Korku yoktu, sadece huzur ve özgürlük hissi.",
      "Uyanınca hala uçuyormuş gibi hissettim."
    ],
    reposts: 3
  },
  {
    id: "2",
    title: "Kovalanmak #kabus",
    content: "Birisi beni sürekli kovalıyordu. Saklanacak yer bulamıyordum. Sonunda bir kapıdan geçip uyandım. #kabus #kaçış",
    createdAt: "10dk önce",
    isPrivate: false,
    likes: 15,
    comments: 5,
    user: { id: "u2", name: "Mehmet", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
    hashtags: ["kabus","kaçış"],
    flood: [
      "Karanlık bir sokakta koşuyordum.",
      "Ayak sesleri peşimdeydi.",
      "Bir kapı buldum ve içeri daldım.",
      "Uyandığımda kalbim çok hızlı atıyordu."
    ],
    reposts: 7
  },
  {
    id: "3",
    title: "Deniz ve Balıklar #huzur",
    content: "Denizin altında nefes alabiliyordum. Rengarenk balıklar etrafımdaydı. #huzur #deniz",
    createdAt: "20dk önce",
    isPrivate: false,
    likes: 22,
    comments: 3,
    user: { id: "u3", name: "Zeynep", avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
    hashtags: ["huzur","deniz"],
    flood: [
      "Denizin dibinde yürüyordum.",
      "Balıklar bana eşlik ediyordu.",
      "Hiç korkmuyordum, aksine huzur doluydu.",
      "Bir balık bana gülümsedi!"
    ],
    reposts: 12
  }
];

export function Explore() {
  const [selectedTag, setSelectedTag] = useState<string|null>(null);
  const [showPopular, setShowPopular] = useState(true);

  // Popüler rüyalar (en çok beğenilenler)
  const popularDreams = [...demoDreams].sort((a,b) => b.likes - a.likes).slice(0,2);
  // Filtreli rüyalar
  const filteredDreams = selectedTag
    ? demoDreams.filter(d => d.hashtags.includes(selectedTag))
    : demoDreams;

  // Tüm hashtag'leri topla
  const allTags = Array.from(new Set(demoDreams.flatMap(d => d.hashtags)));

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Keşfet</h2>
        <Button variant={showPopular ? "default" : "outline"} size="sm" onClick={() => setShowPopular(true)}>
          Popüler Rüyalar
        </Button>
        <Button variant={!showPopular ? "default" : "outline"} size="sm" onClick={() => setShowPopular(false)}>
          Tüm Rüyalar
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setSelectedTag(null)} title="Filtreyi temizle"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {/* Hashtag sistemi */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allTags.map(tag => (
          <Button
            key={tag}
            size="sm"
            variant={selectedTag === tag ? "default" : "outline"}
            className="flex items-center gap-1"
            onClick={() => setSelectedTag(tag)}
          >
            <Hash className="h-4 w-4" /> #{tag}
          </Button>
        ))}
      </div>
      {/* Flood (zincir) gösterimi */}
      {(showPopular ? popularDreams : filteredDreams).map(dream => (
        <div key={dream.id} className="mb-6">
          <DreamCard dream={dream} />
          <div className="ml-8 border-l-2 border-blue-200 pl-4 mt-2 flex flex-col gap-2">
            {dream.flood.map((item, i) => (
              <div key={i} className="text-sm text-blue-900 bg-blue-50 rounded p-2 shadow-sm">
                {item}
              </div>
            ))}
          </div>
          {/* Hashtagler */}
          <div className="flex gap-2 mt-2 ml-8 flex-wrap">
            {dream.hashtags.map(tag => (
              <Button key={tag} size="xs" variant="ghost" className="px-2 py-1 text-xs" onClick={() => setSelectedTag(tag)}>
                #{tag}
              </Button>
            ))}
          </div>
          {/* Repost ve popülerlik */}
          <div className="flex items-center gap-3 mt-2 ml-8">
            <span className="text-xs text-muted-foreground">{dream.reposts} kez paylaşıldı</span>
            {dream.likes > 10 && <span className="text-xs font-bold text-primary">🔥 Popüler Rüya</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
