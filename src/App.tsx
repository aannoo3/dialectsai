import { Toaster } from "@/components/ui/toaster";
import TribeCompetition from "@/pages/TribeCompetition";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AddWord from "./pages/AddWord";
import WordDetail from "./pages/WordDetail";
import DialectMapper from "./pages/DialectMapper";
import Leaderboard from "./pages/Leaderboard";
import Badges from "./pages/Badges";
import DailyChallenge from "./pages/DailyChallenge";
import WazirVoiceChat from "./pages/WazirVoiceChat";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/add-word" element={<AddWord />} />
          <Route path="/word/:id" element={<WordDetail />} />
          <Route path="/dialect-mapper" element={<DialectMapper />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/daily-challenge" element={<DailyChallenge />} />
          <Route path="/tribe-competition" element={<TribeCompetition />} />
          <Route path="/wazir-voice" element={<WazirVoiceChat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
