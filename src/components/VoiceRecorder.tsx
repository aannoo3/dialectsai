import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, base64: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const VoiceRecorder = ({ onRecordingComplete, disabled, isProcessing }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(audioBlob);
        onRecordingComplete(audioBlob, base64);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Auto-stop after 60 seconds for voice chat
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 60000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isProcessing) {
    return (
      <Button variant="outline" size="lg" disabled className="rounded-full h-16 w-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {isRecording ? (
        <>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={stopRecording}
            className="rounded-full h-16 w-16 animate-pulse"
          >
            <Square className="h-6 w-6" />
          </Button>
          <span className="text-sm text-muted-foreground">{formatTime(recordingTime)}</span>
        </>
      ) : (
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={startRecording}
          disabled={disabled}
          className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
        >
          <Mic className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default VoiceRecorder;
