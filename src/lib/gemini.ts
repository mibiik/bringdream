const GEMINI_API_KEY = "AIzaSyC9s1KViXMx5ZQ-_GYcyKr0saBEs8ewpak";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  promptFeedback?: any;
}

export type DreamInterpretationMode =
  | "klasik"
  | "olumlu"
  | "kabus"
  | "freud"
  | "jung"
  | "arabi"
  | "modern"
  | "kisa";

interface UserProfile {
  displayName?: string;
  username?: string;
  age?: number;
  occupation?: string;
  interests?: string[];
}

const createUserContext = (user?: UserProfile): string => {
  if (!user) return "";
  const contextParts = [
    user.age ? `${user.age} yaş` : "",
    user.occupation,
    ...(user.interests || [])
  ].filter(Boolean);
  return contextParts.length > 0 ? contextParts.join(", ") : "";
};

const getUserName = (user?: UserProfile): string => {
  return user?.displayName || user?.username || "Değerli Dostum";
};

const BASE_INSTRUCTION = `
**TEMEL GÖREV:** Sen sıcakkanlı, empatik bir terapist gibi davranan bir rüya yorumcususun. 
Kullanıcıya adı ile hitap et ve tonun her zaman destekleyici, anlayışlı ve yargısız olsun.

**KURAL:** 
- Yanıtta **kesinlikle** sadece vurgu amacıyla çift yıldız kullanacaksın (**kelime**).
- Başka hiçbir yerde yıldız kullanma.
- Yanıtta yorum türünü belirten bir başlık kullanma.

**KİŞİSELLEŞTİRME:** {userContext}
**RÜYA:** {dream}

**YORUM YAKLAŞIMI:**`;

const INTERPRETATION_STYLES = {
  klasik: "Rüyadaki sembollerin geleneksel anlamlarına odaklan ve {name} için özel anlamlarını nazikçe keşfet.",
  olumlu: "Rüyadaki **pozitif** yönleri ve fırsatları vurgula, {name}'e umut ve güç veren bir bakış açısı sun.",
  kabus: "Korkutucu unsurların altındaki endişeleri **nazikçe** ele al. {name}'in güvende olduğunu ve duyguların yönetilebilir olduğunu vurgula.",
  freud: "Rüyayı bilinçaltı arzular ve bastırılmış duygular açısından **Freudyen** bakışla analiz et. {name}'in yaşam deneyimleriyle ilişkilendir.",
  jung: "Rüyadaki **arketipsel** sembolleri ve {name}'in **bireyselleşme** sürecini analiz et. Evrensel temaların kişisel anlamını keşfet.",
  arabi: "Rüyayı **manevi** açıdan yorumla. {name}'in ruhsal yolculuğundaki işaretlere ve içsel mesajlara odaklan.",
  modern: "Rüyayı **güncel psikoloji** ışığında ve {name}'in yaşam koşulları bağlamında yorumla. Pratik içgörüler sun.",
  kisa: "Rüyanın özünü ve ana mesajını {name} için **2-3 cümle** ile özetle."
};

const createPrompt = (mode: DreamInterpretationMode, dream: string, user?: UserProfile): string => {
  const name = getUserName(user);
  const userContext = createUserContext(user);
  const contextInfo = userContext ? 
    `${name}'in profili (${userContext}) göz önünde bulundurularak yorum yapılacak.` :
    `${name} için genel bir yorum yapılacak.`;

  return BASE_INSTRUCTION
    .replace("{userContext}", contextInfo)
    .replace("{dream}", dream)
    + "\n" + INTERPRETATION_STYLES[mode].replace("{name}", name);
};

const isDefneUser = (user?: { displayName?: string; username?: string }): boolean => {
  if (!user) return false;
  // İsimdeki tüm boşlukları ve Türkçe karakter farklılıklarını normalize et
  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };
  
  const names = ["defne", "defneoz"];
  const dName = normalizeText(user.displayName || "");
  const uname = normalizeText(user.username || "");
  return names.some(name => dName === name || uname === name);
};

export const interpretDream = async (
  dreamContent: string,
  mode: DreamInterpretationMode = "klasik",
  user?: UserProfile
): Promise<{ result: string; mode: string }> => {
  try {
    let realMode = mode;
    if (mode === "olumlu" && isDefneUser(user)) {
      realMode = "klasik";
    }

    const prompt = createPrompt(realMode, dreamContent, user);
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { result: data.candidates[0].content.parts[0].text, mode: realMode };
    }
    
    throw new Error("Rüya yorumlanamadı.");
  } catch (error) {
    console.error("Rüya yorumlama hatası:", error);
    return { 
      result: "Rüya yorumlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.", 
      mode 
    };
  }
};
