import { useNavigate } from "react-router-dom";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 border border-gray-200 rounded-full shadow px-3 py-1 text-gray-700 hover:bg-gray-100 transition"
      aria-label="Geri Dön"
      type="button"
    >
      ← Geri
    </button>
  );
}
