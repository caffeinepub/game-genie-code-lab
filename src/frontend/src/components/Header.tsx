import { Gamepad2, History, Library, Search } from "lucide-react";
import { motion } from "motion/react";
import type { AppPage } from "../App";

interface HeaderProps {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
}

export default function Header({ page, onNavigate }: HeaderProps) {
  const currentTab = page.view === "home" ? page.tab : "";

  const navItems = [
    { id: "search", label: "Find Games", icon: Search },
    { id: "library", label: "My Library", icon: Library },
    { id: "history", label: "Code History", icon: History },
  ];

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            className="flex items-center gap-3 group"
            onClick={() => onNavigate({ view: "home", tab: "search" })}
            data-ocid="header.link"
          >
            <div className="relative">
              <Gamepad2 className="w-7 h-7 neon-text-green animate-pulse_neon" />
            </div>
            <div>
              <h1 className="pixel-heading text-xs neon-text-green tracking-wider">
                GAME GENIE
              </h1>
              <p className="text-[9px] text-muted-foreground tracking-widest uppercase">
                Cheat Code Generator
              </p>
            </div>
          </button>

          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={`nav.${item.id}.link`}
                  onClick={() => onNavigate({ view: "home", tab: item.id })}
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-all duration-200 ${
                    isActive
                      ? "text-neon-green"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-sm"
                      style={{
                        background: "oklch(0.78 0.22 145 / 0.1)",
                        border: "1px solid oklch(0.78 0.22 145 / 0.4)",
                        boxShadow: "0 0 8px oklch(0.78 0.22 145 / 0.2)",
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.4,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
