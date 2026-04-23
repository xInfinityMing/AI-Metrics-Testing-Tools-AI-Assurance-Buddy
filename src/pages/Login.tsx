import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, ArrowRight, Lock, Building2, Workflow, FileBarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isAuthenticated, signIn, signInAs, MOCK_USERS } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }

  const emailError = touched.email && !EMAIL_RE.test(email) ? "Enter a valid work email." : "";
  const passwordError = touched.password && password.length < 6 ? "Password must be at least 6 characters." : "";
  const formValid = EMAIL_RE.test(email) && password.length >= 6;

  const completeLogin = (signInFn: () => void, message: string) => {
    setSubmitting(true);
    setTimeout(() => {
      signInFn();
      toast({ title: "Welcome", description: message });
      navigate(from, { replace: true });
    }, 350);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;
    completeLogin(() => signIn(email), `Signed in as ${email}`);
  };

  const handleSSO = () => {
    completeLogin(() => signInAs(MOCK_USERS[0]), "SSO sign-in (mock) as Alson Tan");
  };

  const handleDemoWorkspace = () => {
    completeLogin(() => signInAs(MOCK_USERS[0]), "Loaded demo workspace as Alson Tan");
  };

  const handleQuickPick = (idx: number) => {
    completeLogin(() => signInAs(MOCK_USERS[idx]), `Signed in as ${MOCK_USERS[idx].name}`);
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      {/* Left — branding panel */}
      <aside
        className="relative hidden flex-1 flex-col justify-between p-12 text-white lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div>AI Metrics Testing Tools</div>
            <div className="text-xs font-normal text-white/70">AI Assurance Buddy</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI Metrics Testing Tools
          </div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Define AI systems, assign models in workflow steps, and ship with confidence.
          </h1>
          <p className="max-w-md text-base text-white/80">
            Define AI systems, assign models in workflow steps, simulate testing, and generate unified assurance reports.
          </p>

          <div className="grid max-w-md gap-3 pt-2">
            {[
              { icon: Workflow, label: "AI Workflow builder with per-step model selection" },
              { icon: ShieldCheck, label: "Safety, quality, grounding, workflow & drift dimensions" },
              { icon: FileBarChart2, label: "Unified assurance reports — presentation-ready" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-white/90">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} AI Team Workspace · POC demo</p>

        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "hsl(var(--primary-glow))" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(var(--primary-glow))" }}
        />
      </aside>

      {/* Right — form panel */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">AI Assurance Buddy</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back. Enter your details to access your dashboard.
            </p>
          </div>

          <Card className="border-border/60 shadow-[var(--shadow-elevated)]">
            <CardContent className="p-6">
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    aria-invalid={!!emailError}
                    required
                  />
                  {emailError && <p className="text-xs font-medium text-destructive">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() =>
                        toast({
                          title: "Password reset",
                          description: "This is a demo — no real reset email is sent.",
                        })
                      }
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    aria-invalid={!!passwordError}
                    required
                  />
                  {passwordError && <p className="text-xs font-medium text-destructive">{passwordError}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                    Remember me on this device
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={!formValid || submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                </div>

                <div className="grid gap-2">
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={handleSSO} disabled={submitting}>
                    <Building2 className="h-4 w-4" /> Continue with Enterprise SSO
                  </Button>
                  <Button type="button" variant="secondary" className="w-full gap-2" onClick={handleDemoWorkspace} disabled={submitting}>
                    <Sparkles className="h-4 w-4" /> Use Demo Workspace
                  </Button>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Demo only. No real authentication is performed.
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick pick mock users */}
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Quick sign in (demo users)
            </div>
            <div className="grid gap-2">
              {MOCK_USERS.map((u, idx) => (
                <button
                  key={u.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickPick(idx)}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {u.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-tight">{u.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.role} · {u.workspace}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
