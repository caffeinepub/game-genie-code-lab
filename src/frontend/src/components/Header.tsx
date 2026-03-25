import type { AppPage } from "@/App";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useMyProfile } from "@/hooks/useQueries";
import { LogOut, Search, Upload, User, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  page: AppPage;
  onNavigate: (p: AppPage) => void;
  onSearch: (q: string) => void;
}

export default function Header({ page, onNavigate, onSearch }: HeaderProps) {
  const { login, clear, identity, isLoggingIn } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal.trim());
      setSearchOpen(false);
    }
  };

  const displayName =
    profile?.displayName || identity?.getPrincipal().toString().slice(0, 8);
  const initials = (displayName || "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => onNavigate({ view: "feed", tab: "latest" })}
          className="flex items-center gap-2 flex-shrink-0"
          data-ocid="nav.link"
        >
          <span className="font-display font-bold text-xl brand-gradient-text tracking-tight">
            FairFeed
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => onNavigate({ view: "feed", tab: "latest" })}
            className={`nav-link px-3 py-1.5 rounded-lg hover:bg-muted ${
              page.view === "feed" ? "text-foreground bg-muted/50" : ""
            }`}
            data-ocid="nav.link"
          >
            Home
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        {searchOpen ? (
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 flex-1 max-w-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search videos..."
                className="pl-9 h-8 bg-muted/60 border-border/60"
                data-ocid="search.input"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchVal("");
              }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Search"
            data-ocid="search.input"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Actions */}
        {identity ? (
          <>
            <Button
              size="sm"
              onClick={() => onNavigate({ view: "upload" })}
              className="hidden sm:flex items-center gap-1.5 brand-gradient text-white border-0 font-semibold"
              data-ocid="upload.primary_button"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2"
                  data-ocid="nav.dropdown_menu"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="brand-gradient text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() =>
                    onNavigate({
                      view: "profile",
                      principal: identity.getPrincipal(),
                    })
                  }
                  data-ocid="nav.link"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate({ view: "upload" })}
                  className="sm:hidden"
                  data-ocid="upload.primary_button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clear} data-ocid="nav.link">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="brand-gradient text-white border-0 font-semibold"
            data-ocid="nav.primary_button"
          >
            {isLoggingIn ? "Connecting..." : "Sign in"}
          </Button>
        )}
      </div>
    </header>
  );
}
