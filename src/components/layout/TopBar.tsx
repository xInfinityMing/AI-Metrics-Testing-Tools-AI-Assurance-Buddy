import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
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

export function TopBar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const initials = user?.initials ?? (user?.name ?? "JD").slice(0, 2).toUpperCase();
  const workspace = user?.workspace ?? "Acme AI";
  const role = user?.role ?? "Admin";
  const displayName = user?.name ?? "Jordan Doe";

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
      <div className="relative ml-auto hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search projects, reports…" className="h-9 rounded-lg border-border/80 bg-secondary pl-9" />
      </div>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-danger px-1 text-[10px] text-danger-foreground">3</Badge>
      </Button>
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
            <span className="text-xs font-normal text-muted-foreground">{user?.email ?? "demo@acme.ai"}</span>
            <span className="mt-1 text-[11px] font-normal text-muted-foreground">{role} · {workspace}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:text-danger">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
