import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Projects from "./pages/Projects.tsx";
import NewProject from "./pages/NewProject.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import RunEvaluation from "./pages/RunEvaluation.tsx";
import ResultsDashboard from "./pages/ResultsDashboard.tsx";
import Reports from "./pages/Reports.tsx";
import ReportView from "./pages/ReportView.tsx";
import Monitoring from "./pages/Monitoring.tsx";
import Settings from "./pages/Settings.tsx";
import ApiMode from "./pages/ApiMode.tsx";
import Login from "./pages/Login.tsx";
import { RequireAuth } from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
          <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/projects/new" element={<RequireAuth><NewProject /></RequireAuth>} />
          <Route path="/projects/new/api-mode" element={<RequireAuth><ApiMode /></RequireAuth>} />
          <Route path="/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
          <Route path="/projects/:id/run" element={<RequireAuth><RunEvaluation /></RequireAuth>} />
          <Route path="/projects/:id/results" element={<RequireAuth><ResultsDashboard /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="/reports/:id" element={<RequireAuth><ReportView /></RequireAuth>} />
          <Route path="/monitoring" element={<RequireAuth><Monitoring /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
