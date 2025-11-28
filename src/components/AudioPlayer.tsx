import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Pause, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  accent?: string;
}

const AudioPlayer = ({ audioUrl, accent }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onLoadedData={() => setIsLoading(false)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlay}
        disabled={isLoading}
        className="space-x-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
        <span>
          {isLoading ? "Loading..." : isPlaying ? "Playing" : "Play"}
          {accent && ` (${accent})`}
        </span>
      </Button>
    </div>
  );
};

export default AudioPlayer;