import React from "react";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { DetailsPanel } from "./DetailsPanel";
import { useMediaQuery } from "@/hooks/use-mobile";

export const ChatLayout: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      {!isMobile && <Sidebar />}
      <main className="flex-1 flex flex-col relative">
        <ChatPanel />
      </main>
      {!isMobile && <DetailsPanel />}
    </div>
  );
};
