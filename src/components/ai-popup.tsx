import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

// **kalın** işaretlemelerini <b>kalın</b> olarak dönüştüren yardımcı fonksiyon (ai-comment.tsx ile aynı)
function renderBold(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
}

interface AIPopupProps {
  comment: string;
  open: boolean;
  onClose: () => void;
}

export function AIPopup({ comment, open, onClose }: AIPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby="dialog-description">
        <DialogTitle className="sr-only">Yapay Zeka Yorumu</DialogTitle>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Yapay Zeka Yorumu</span>
        </div>
        <div 
          id="dialog-description"
          className="text-base whitespace-pre-line" 
          style={{ maxHeight: '40vh', overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: renderBold(comment) }} 
        />
      </DialogContent>
    </Dialog>
  );
}
