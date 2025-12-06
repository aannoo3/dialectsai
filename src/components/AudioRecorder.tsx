import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AudioRecorderProps {
  onAudioRecorded: (audioUrl: string) => void;
  disabled?: boolean;
}

const AudioRecorder = ({ onAudioRecorded, disabled }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    setIsUploading(true);
    try {
      const fileName = `recording_${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath);

      onAudioRecorded(publicUrl);
      toast.success("Audio recorded successfully!");
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast.error("Failed to save recording");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="space-x-2"
        >
          <Square className="h-4 w-4" />
          <span>Stop ({formatTime(recordingTime)})</span>
        </Button>
      ) : isUploading ? (
        <Button type="button" variant="outline" size="sm" disabled className="space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          disabled={disabled}
          className="space-x-2"
        >
          <Mic className="h-4 w-4" />
          <span>Record</span>
        </Button>
      )}
    </div>
  );
};

export default AudioRecorder;
