import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveProfile } from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SetDisplayNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetDisplayNameDialog({
  open,
  onOpenChange,
}: SetDisplayNameDialogProps) {
  const [name, setName] = useState("");
  const saveMutation = useSaveProfile();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveMutation.mutateAsync(name.trim());
      toast.success("Welcome to FairFeed! 🎉");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save name. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-ocid="onboarding.dialog">
        <DialogHeader>
          <DialogTitle className="brand-gradient-text font-display text-2xl">
            Welcome! 👋
          </DialogTitle>
          <DialogDescription>
            Choose a display name that others will see on your videos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="e.g. Alex Creator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoFocus
              data-ocid="onboarding.input"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-ocid="onboarding.cancel_button"
            >
              Skip
            </Button>
            <Button
              type="submit"
              className="flex-1 brand-gradient text-white border-0 font-semibold"
              disabled={!name.trim() || saveMutation.isPending}
              data-ocid="onboarding.submit_button"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Let's go!"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
