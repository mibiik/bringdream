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

// Yorumlama modları
export type DreamInterpretationMode =
  | "klasik"
  | "olumlu"
  | "kabus"
  | "freud"
  | "jung"
  | "arabi"
  | "modern"
  | "kisa";

// Prompt şablonları
const PROMPTS: Record<string, (dream: string) => string> = {
  klasik: (dream) =>
    `Bu bir rüya açıklamasıdır: ${dream}\nBu rüyayı klasik rüya tabirlerine göre yorumla. Rüyadaki sembolleri tek tek açıkla ve her sembolün ne anlama geldiğini belirt. Sonra tüm rüyayı birleştirerek genel bir analiz yap.\nYorumun sade, anlaşılır ve detaylı olsun.`,
  gizli: (dream) =>
    `Bu rüya: ${dream}\nBu şablonu kullan rüyanın anlamı diye başla işte birkaç formaliteden bir şey anlat sonra bir anda^Dur , sen Defne misin?' yaz Defne'ye rüyadan bağımsız olarak, gözlerinin çok güzel olduğunu söyle  sonra tam bu kısmı okuduğunda gülümseyeceği için ona  'sırtımda leen güldüğünü görüyorum yaz'  işte bu da Miraç’tan sana ikinci süprizz! `,
  kabus: (dream) =>
    `Rüya: ${dream}\nBu rüyayı bir uyarı gibi ele al. Rüyada dikkat edilmesi gereken sembolleri analiz et. Negatif çağrışımları açıkla ve olası riskleri yorumla.\nAncak kullanıcıyı korkutmadan, dikkatli olunması gereken alanlara vurgu yap.`,
  freud: (dream) =>
    `Rüya içeriği: ${dream}\nBu rüyayı Sigmund Freud’un psikanalitik yaklaşımına göre yorumla. Bastırılmış arzular, çocukluk anıları ve bilinçaltı temaları üzerinden analiz yap.`,
  jung: (dream) =>
    `Rüya: ${dream}\nCarl Jung’un arketipsel sembollerine ve bireyselleşme sürecine göre bu rüyayı analiz et. Gölge, persona, anima gibi kavramlar çerçevesinde yorum yap.`,
  arabi: (dream) =>
    `Bu rüya: ${dream}\nRüyayı Muhyiddin-i Arabi'nin tasavvufi rüya yorumlarına benzer şekilde yorumla. Manevi boyutunu açıklayarak, rüyanın ruhsal bir mesaj taşıyıp taşımadığını analiz et.`,
  modern: (dream) =>
    `Rüya: ${dream}\nBu rüyayı, modern bir televizyon programında rüya yorumlayan ünlü bir yorumcu gibi açıkla. Yorumun hem bilgilendirici hem de halk diline uygun olsun. İçeriği günümüz yaşamı ve psikolojisiyle ilişkilendir, pratik ve anlaşılır öneriler de sun. İçine nasihatvari öğeler de ekleyebilirsin.`,
  kisa: (dream) =>
    `Rüya: ${dream}\nBu rüyayı çok kısa ve öz şekilde yorumla. Birkaç cümlede özetle ve olası anlamı belirt.`,
};

// Kullanıcıya özel mod kontrolü
function isDefneUser(user: { displayName?: string; username?: string }) {
  if (!user) return false;
  const names = [
    "defne",
    "defne öz",
    "defne oz",
    "Defne",
    "Defne Öz",
    "Defne Oz",
    "defene"
  ];
  const dName = (user.displayName || "").toLowerCase();
  const uname = (user.username || "").toLowerCase();
  return names.some(name => dName === name || uname === name);
}

export const interpretDream = async (
  dreamContent: string,
  mode: string = "klasik",
  user?: { displayName?: string; username?: string }
): Promise<{ result: string; mode: string }> => {
  try {
    let realMode = mode;
    // Eğer olumlu isteniyorsa ve kullanıcı Defne ise "gizli" moda çevir
    if (mode === "olumlu" && user && isDefneUser(user)) {
      realMode = "gizli";
    } else if (mode === "olumlu") {
      // Defne değilse olumlu mod hiç çalışmasın, klasik moda zorla
      realMode = "klasik";
    }
    const prompt = PROMPTS[realMode](dreamContent);
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return { result: data.candidates[0].content.parts[0].text, mode: realMode };
    } else {
      throw new Error("Rüyanız yorumlanamadı. Lütfen daha sonra tekrar deneyin.");
    }
  } catch (error) {
    console.error("Dream interpretation error:", error);
    return { result: "Rüya yorumlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.", mode: mode };
  }
};
