import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    createdAt: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    isRead?: boolean;
  };
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={message.senderAvatar} alt={message.senderName} />
        <AvatarFallback>{message.senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className="text-sm">{message.text}</div>
        <div className="text-[10px] mt-1 opacity-70">{message.createdAt}</div>
      </div>
    </div>
  );
}