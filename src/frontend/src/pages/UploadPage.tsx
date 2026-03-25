import type { AppPage } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { usePostVideo } from "@/hooks/useQueries";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import { ArrowLeft, CheckCircle2, Loader2, Upload, Video } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface UploadPageProps {
  onNavigate: (p: AppPage) => void;
}

export default function UploadPage({ onNavigate }: UploadPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, progress, isUploading } = useStorageUpload();
  const postVideo = usePostVideo();

  const isSubmitting = isUploading || postVideo.isPending;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file.");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be under 500MB.");
      return;
    }
    setVideoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please add a title.");
      return;
    }
    if (!videoFile) {
      toast.error("Please select a video.");
      return;
    }

    try {
      const blobKey = await uploadFile(videoFile);
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      await postVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        tags: parsedTags,
        blobKey,
      });
      setDone(true);
      toast.success("Video uploaded successfully! 🎉");
      setTimeout(() => onNavigate({ view: "feed", tab: "latest" }), 2000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        </motion.div>
        <h2 className="font-display font-bold text-2xl">Upload complete!</h2>
        <p className="text-muted-foreground text-sm">
          Redirecting to the feed...
        </p>
        <div data-ocid="upload.success_state" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button
        type="button"
        onClick={() => onNavigate({ view: "feed", tab: "latest" })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-ocid="upload.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-bold text-3xl mb-1">
          Upload a <span className="brand-gradient-text">Video</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Share your story with the world — fairly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video dropzone */}
          <div className="space-y-2">
            <Label>Video File</Label>
            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              data-ocid="upload.upload_button"
            />
            {/* Visible dropzone */}
            <button
              type="button"
              className={`upload-dropzone w-full ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-ocid="upload.dropzone"
            >
              {videoFile ? (
                <div className="space-y-2">
                  <Video className="w-10 h-10 text-brand-purple mx-auto" />
                  <p className="font-semibold text-sm">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold text-sm">
                    Drag & drop your video here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse — MP4, MOV, WebM up to 500MB
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2" data-ocid="upload.loading_state">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading video...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Give your video a great title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
              data-ocid="upload.input"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's your video about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none"
              data-ocid="upload.textarea"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="travel, cooking, music (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isSubmitting}
              data-ocid="upload.input"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full brand-gradient text-white border-0 font-semibold text-base"
            disabled={isSubmitting || !videoFile || !title.trim()}
            data-ocid="upload.submit_button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isUploading ? `Uploading ${progress}%...` : "Publishing..."}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Publish Video
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
