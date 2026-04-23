import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown, FileText, FolderKanban, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, signOut } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { useProjects } from "@/data/projectStore";
import { REPORTS } from "@/data/mock";

export function TopBar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const initials = user?.initials ?? (user?.name ?? "JD").slice(0, 2).toUpperCase();
  const workspace = user?.workspace ?? "AI Team";
  const role = user?.role ?? "Admin";
  const displayName = user?.name ?? "Jordan Doe";

  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { projects: [], reports: [] };
    return {
      projects: projects
        .filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.useCase?.toLowerCase().includes(q) ||
          p.owner?.toLowerCase().includes(q),
        )
        .slice(0, 5),
      reports: REPORTS.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, projects]);

  const hasResults = results.projects.length > 0 || results.reports.length > 0;

  function go(path: string) {
    setOpen(false);
    setQuery("");
    navigate(path);
  }

  const handleSignOut = () => {
    signOut();
    toast({ title: "Signed out", description: "See you next time." });
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-3 backdrop-blur md:px-6">
      <SidebarTrigger className="text-foreground" />
      <Button variant="ghost" size="sm" className="hidden gap-2 md:flex">
        <span className="text-xs text-muted-foreground">Workspace</span>
        <span className="text-sm font-medium">{workspace}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      <div ref={containerRef} className="relative ml-auto hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && results.projects[0]) {
              go(`/projects/${results.projects[0].id}`);
            }
          }}
          placeholder="Search projects, reports…"
          className="h-9 rounded-lg border-border/80 bg-secondary pl-9"
        />
        {open && query.trim() && (
          <div className="absolute left-0 right-0 top-11 z-40 overflow-hidden rounded-lg border bg-popover shadow-lg">
            {!hasResults ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No results for “{query}”.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto py-1">
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Projects
                    </div>
                    {results.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => go(`/projects/${p.id}`)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{p.useCase}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results.reports.length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Reports
                    </div>
                    {results.reports.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => go(`/reports/${r.id}`)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{r.title}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{r.summary}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-danger px-1 text-[10px] text-danger-foreground">3</Badge>
      </Button> */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border bg-secondary py-1 pl-1 pr-3 transition-colors hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight md:block">
              <div className="text-xs font-medium">{displayName}</div>
              <div className="text-[10px] text-muted-foreground">{role}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs font-normal text-muted-foreground">{user?.email ?? "demo@wphdigital.com"}</span>
            <span className="mt-1 text-[11px] font-normal text-muted-foreground">{role} · {workspace}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem> */}
          <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:text-danger">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
