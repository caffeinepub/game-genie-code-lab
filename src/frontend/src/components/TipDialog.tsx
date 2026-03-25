import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTipVideo } from "@/hooks/useQueries";
import { Coins, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TIP_AMOUNTS = [
  { value: BigInt(1), label: "1", emoji: "🪙" },
  { value: BigInt(5), label: "5", emoji: "💰" },
  { value: BigInt(10), label: "10", emoji: "✨" },
  { value: BigInt(25), label: "25", emoji: "🌟" },
  { value: BigInt(50), label: "50", emoji: "🔥" },
  { value: BigInt(100), label: "100", emoji: "💎" },
];

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: bigint;
  creatorName: string;
}

export default function TipDialog({
  open,
  onOpenChange,
  videoId,
  creatorName,
}: TipDialogProps) {
  const [selected, setSelected] = useState<bigint | null>(null);
  const tipMutation = useTipVideo();

  const handleTip = async () => {
    if (!selected) return;
    try {
      await tipMutation.mutateAsync({ videoId, amount: selected });
      toast.success(
        `Tipped ${selected.toString()} coins to ${creatorName}! 🎉`,
        {
          description: "Your support means everything to creators.",
        },
      );
      onOpenChange(false);
      setSelected(null);
    } catch {
      toast.error("Failed to send tip. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-ocid="tip.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-coin-gold" />
            <span>Tip {creatorName}</span>
          </DialogTitle>
          <DialogDescription>
            Send virtual coins to show your appreciation!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 my-2">
          {TIP_AMOUNTS.map((tip) => (
            <button
              key={tip.label}
              type="button"
              className={`tip-amount-btn ${selected === tip.value ? "selected" : ""}`}
              onClick={() => setSelected(tip.value)}
              data-ocid="tip.toggle"
            >
              <span className="text-xl">{tip.emoji}</span>
              <span>{tip.label}</span>
              <span className="text-xs opacity-70">coins</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            data-ocid="tip.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 brand-gradient text-white border-0 font-semibold"
            disabled={!selected || tipMutation.isPending}
            onClick={handleTip}
            data-ocid="tip.confirm_button"
          >
            {tipMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>Send {selected ? `${selected} ` : ""}coins 🪙</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
