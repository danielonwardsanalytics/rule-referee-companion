import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Library from "./pages/Library";
import GameDetail from "./pages/GameDetail";
import HouseRuleDetail from "./pages/HouseRuleDetail";
import HouseRuleEditor from "./pages/HouseRuleEditor";
import GameTemplate from "./pages/GameTemplate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/game/:gameId" element={<GameDetail />} />
          <Route path="/house-rules/new" element={<HouseRuleEditor />} />
          <Route path="/house-rules/:ruleSetId/edit" element={<HouseRuleEditor />} />
          <Route path="/house-rules/:gameId/:ruleSetId" element={<HouseRuleDetail />} />
          <Route path="/play/:gameId" element={<GameTemplate />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
