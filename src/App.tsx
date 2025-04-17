import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import CreateDream from "./pages/CreateDream";
import DreamDetail from "./pages/DreamDetail";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import EditDream from "./pages/EditDream";
import UserProfile from "./pages/UserProfile";
import About from "./pages/About";
import { AuthProvider } from "./components/auth-provider";
import { useEffect } from "react";
import { createFirestoreIndexes } from "./lib/firebase";
import { ChatLayout } from "./components/ChatLayout";

const queryClient = new QueryClient();

const App = () => {
  // Create necessary Firestore indexes on app initialization
  useEffect(() => {
    createFirestoreIndexes();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/create-dream" element={<CreateDream />} />
              <Route path="/dream/:dreamId" element={<DreamDetail />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/about" element={<About />} />
              <Route path="/messages/:contactId" element={<Messages />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/editdream/:dreamId" element={<EditDream />} />
              {/* CUSTOM CHAT LAYOUT ROUTE */}
              <Route path="/chat" element={<ChatLayout />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
