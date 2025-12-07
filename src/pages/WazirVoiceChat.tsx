import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import VoiceRecorder from "@/components/VoiceRecorder";
import { streamWazirChat } from "@/utils/streamChat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Bot, User, Mic, Keyboard, Info, Volume2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const WazirVoiceChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInputText("");

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamWazirChat({
        messages: [...messages, userMsg],
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob, base64: string) => {
    // For now, prompt user to type what they said (future: auto-transcribe)
    toast.info("Voice received! Type what you said to teach the AI.", {
      description: "Your audio helps train the Wazir dialect model.",
    });
    
    // Save the audio for training data collection
    if (userId) {
      try {
        const fileName = `voice_training_${Date.now()}.webm`;
        const filePath = `wazir-training/${userId}/${fileName}`;
        
        await supabase.storage.from("audio").upload(filePath, audioBlob, {
          contentType: "audio/webm",
        });
        
        console.log("Training audio saved:", filePath);
      } catch (error) {
        console.error("Error saving training audio:", error);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Wazir Dialect AI</h1>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Practice speaking Wazir Pashto with AI. Your conversations help train the model.
          </p>
        </div>

        <Card className="mb-4 border-accent/20 bg-accent/5">
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-accent mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Training Progress</p>
                <p className="text-muted-foreground">
                  Current data: ~0 hours. Need 5-10 hours for basic recognition, 20-50 hours for MVP.
                  Every conversation helps!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-[60vh] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Chat with Wazir AI</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={inputMode === "voice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("voice")}
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Voice
                </Button>
                <Button
                  variant={inputMode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("text")}
                >
                  <Keyboard className="h-4 w-4 mr-1" />
                  Text
                </Button>
              </div>
            </div>
            <CardDescription>
              Speak or type in Wazir Pashto. The AI will respond in Wazir dialect.
            </CardDescription>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 text-primary/40" />
                <p className="text-lg font-medium">سلام علیکم!</p>
                <p className="text-sm mt-2">Start a conversation in Wazir Pashto</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Try saying:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["سلام", "څنګه یې؟", "زه ښه یم", "تاسو څنګه یاست؟"].map((phrase) => (
                      <Button
                        key={phrase}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(phrase)}
                        className="text-base"
                      >
                        {phrase}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap" dir="rtl">
                        {msg.content}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <CardContent className="border-t pt-4">
            {inputMode === "voice" ? (
              <div className="flex flex-col items-center gap-2">
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecording}
                  disabled={isLoading}
                  isProcessing={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Hold to record, then type what you said
                </p>
              </div>
            ) : (
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type in Wazir Pashto..."
                  disabled={isLoading}
                  className="flex-1 text-base"
                  dir="rtl"
                />
                <Button type="submit" disabled={isLoading || !inputText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Help Train the Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">1</div>
              <p>Use the <strong>Daily Challenge</strong> to label words in Wazir dialect with audio recordings</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">2</div>
              <p>Have conversations here - your voice recordings are saved for training</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">3</div>
              <p><strong>Add new words</strong> with clear audio pronunciations</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">4</div>
              <p>Invite other Wazir speakers to contribute - we need 20-50 hours of audio for MVP</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WazirVoiceChat;
