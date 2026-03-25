import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useAddComment, useComments } from "@/hooks/useQueries";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CommentSectionProps {
  videoId: bigint;
  onLoginRequired: () => void;
}

function timeAgo(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommentSection({
  videoId,
  onLoginRequired,
}: CommentSectionProps) {
  const { data: comments = [], isLoading } = useComments(videoId);
  const addComment = useAddComment();
  const { identity } = useInternetIdentity();
  const [text, setText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      onLoginRequired();
      return;
    }
    if (!text.trim()) return;
    try {
      await addComment.mutateAsync({ videoId, text: text.trim() });
      setText("");
    } catch {
      toast.error("Failed to post comment.");
    }
  };

  return (
    <section className="space-y-4" data-ocid="comments.section">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments{" "}
        {comments.length > 0 && (
          <span className="text-muted-foreground text-sm font-normal">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="brand-gradient text-white text-xs">
            {identity
              ? identity.getPrincipal().toString().slice(0, 2).toUpperCase()
              : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={identity ? "Add a comment..." : "Sign in to comment"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            onClick={() => {
              if (!identity) onLoginRequired();
            }}
            data-ocid="comments.textarea"
          />
          {text.trim() && (
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={addComment.isPending}
                className="brand-gradient text-white border-0"
                data-ocid="comments.submit_button"
              >
                {addComment.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Post
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Comment list */}
      {isLoading ? (
        <div
          className="flex items-center justify-center py-6"
          data-ocid="comments.loading_state"
        >
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div
          className="text-center py-8 text-muted-foreground text-sm"
          data-ocid="comments.empty_state"
        >
          No comments yet. Be the first!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, i) => (
            <div
              key={comment.id.toString()}
              className="flex gap-3"
              data-ocid={`comments.item.${i + 1}`}
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="bg-muted text-xs">
                  {comment.author.toString().slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold truncate max-w-[120px]">
                    {comment.author.toString().slice(0, 12)}...
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
