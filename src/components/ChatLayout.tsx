import React from "react";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { DetailsPanel } from "./DetailsPanel";

export const ChatLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        <ChatPanel />
      </main>
      <DetailsPanel />
    </div>
  );
};
