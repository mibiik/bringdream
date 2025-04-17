import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteDreamDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
  minimal?: boolean;
}

export function DeleteDreamDialog({ open, onClose, onConfirm, minimal }: DeleteDreamDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-xs p-6 rounded-xl text-center"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <Trash2 className="mx-auto mb-2 text-destructive" size={32} />
        <div className="font-semibold text-lg mb-2">Emin misiniz?</div>
        {minimal ? null : (
          <>
            <div className="text-sm mb-4">Bu rüyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz. Rüyanız "Silinen Dosyalar" bölümüne taşınacak.</div>
            <label className="flex items-center justify-center gap-2 mb-4 text-xs">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
              />
              Bir daha gösterme
            </label>
          </>
        )}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onClose}>Hayır</Button>
          <Button variant="destructive" onClick={() => onConfirm(dontShowAgain)}>Evet</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
