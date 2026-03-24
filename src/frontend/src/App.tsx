import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import { useActor } from "./hooks/useActor";
import { useSeedData } from "./hooks/useQueries";
import GameDetailPage from "./pages/GameDetailPage";
import HomePage from "./pages/HomePage";

export type AppPage =
  | { view: "home"; tab: string }
  | { view: "detail"; gameId: bigint };

export default function App() {
  const [page, setPage] = useState<AppPage>({ view: "home", tab: "search" });
  const { actor, isFetching } = useActor();
  const seedMutation = useSeedData();
  const seedMutateRef = useRef(seedMutation.mutate);
  seedMutateRef.current = seedMutation.mutate;

  useEffect(() => {
    if (!actor || isFetching) return;
    const seeded = localStorage.getItem("gameGenie_seeded_v3");
    if (!seeded) {
      seedMutateRef.current(undefined, {
        onSuccess: () => {
          localStorage.setItem("gameGenie_seeded_v3", "1");
        },
      });
    }
  }, [actor, isFetching]);

  const navigateTo = (p: AppPage) => setPage(p);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header page={page} onNavigate={navigateTo} />
      <main className="flex-1">
        {page.view === "home" && (
          <HomePage
            activeTab={page.tab}
            onTabChange={(tab) => setPage({ view: "home", tab })}
            onSelectGame={(id) => setPage({ view: "detail", gameId: id })}
          />
        )}
        {page.view === "detail" && (
          <GameDetailPage
            gameId={page.gameId}
            onBack={() => setPage({ view: "home", tab: "library" })}
          />
        )}
      </main>
      <footer className="border-t border-border/40 py-4 px-6 text-center">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="neon-text-pink">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="neon-text-green hover:opacity-80 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
      <Toaster />
    </div>
  );
}
