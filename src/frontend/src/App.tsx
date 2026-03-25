import { Toaster } from "@/components/ui/sonner";
import type { Principal } from "@icp-sdk/core/principal";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import SetDisplayNameDialog from "./components/SetDisplayNameDialog";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useMyProfile } from "./hooks/useQueries";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";
import VideoDetailPage from "./pages/VideoDetailPage";

export type AppPage =
  | { view: "feed"; tab: "latest" | "trending" }
  | { view: "video"; videoId: bigint }
  | { view: "upload" }
  | { view: "profile"; principal: Principal };

function AppInner() {
  const [page, setPage] = useState<AppPage>({ view: "feed", tab: "latest" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  // Prompt for display name on first login
  useEffect(() => {
    if (!isInitializing && identity && !profileLoading && !profile) {
      setShowNameDialog(true);
    }
  }, [identity, isInitializing, profile, profileLoading]);

  const handleNavigate = (p: AppPage) => {
    setPage(p);
    setSearchQuery("");
  };

  const handleSearch = (q: string) => {
    setPage({ view: "feed", tab: "latest" });
    setSearchQuery(q);
  };

  const handleLoginRequired = () => {
    // Prompt user to log in — handled by Header button
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header page={page} onNavigate={handleNavigate} onSearch={handleSearch} />

      <main className="flex-1">
        {page.view === "feed" && (
          <FeedPage
            tab={page.tab}
            onTabChange={(tab) => setPage({ view: "feed", tab })}
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
          />
        )}
        {page.view === "video" && (
          <VideoDetailPage
            videoId={page.videoId}
            onNavigate={handleNavigate}
            onLoginRequired={handleLoginRequired}
          />
        )}
        {page.view === "upload" && identity && (
          <UploadPage onNavigate={handleNavigate} />
        )}
        {page.view === "upload" && !identity && (
          <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
            <p className="font-display font-bold text-xl">
              Sign in to upload videos
            </p>
            <p className="text-muted-foreground text-sm">
              You need to be signed in to share content.
            </p>
          </div>
        )}
        {page.view === "profile" && (
          <ProfilePage principal={page.principal} onNavigate={handleNavigate} />
        )}
      </main>

      <footer className="border-t border-border/40 py-5 px-6">
        <p className="text-muted-foreground text-xs text-center">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-brand-pink">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-purple hover:opacity-80 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster richColors />

      {/* First login display name prompt */}
      <SetDisplayNameDialog
        open={showNameDialog}
        onOpenChange={setShowNameDialog}
      />
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
