import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Trash2, Upload, Volume2, FileAudio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const TrainingDataCollector = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedDialect, setSelectedDialect] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load user defaults on mount
  useEffect(() => {
    const loadDefaults = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("default_language_id, default_dialect_id")
        .eq("id", user.id)
        .single();

      if (profile?.default_language_id) {
        setSelectedLanguage(profile.default_language_id.toString());
        if (profile.default_dialect_id) {
          setSelectedDialect(profile.default_dialect_id.toString());
        }
      }
      setDefaultsLoaded(true);
    };
    loadDefaults();
  }, []);

  // Fetch languages
  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch dialects based on selected language
  const { data: dialects } = useQuery({
    queryKey: ["dialects", selectedLanguage],
    queryFn: async () => {
      if (!selectedLanguage) return [];
      const { data, error } = await supabase
        .from("dialects")
        .select("*")
        .eq("language_id", parseInt(selectedLanguage))
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLanguage,
  });

  // Fetch user's training data filtered by selected dialect
  const { data: trainingData } = useQuery({
    queryKey: ["training-data", selectedDialect],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let query = supabase
        .from("training_data")
        .select(`
          *,
          languages(name),
          dialects(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (selectedDialect) {
        query = query.eq("dialect_id", parseInt(selectedDialect));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: defaultsLoaded,
  });

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

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const playPauseAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
    setRecordingTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setRecordingTime(0); // Will be calculated from audio metadata
    
    // Try to get audio duration
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      setRecordingTime(Math.round(audio.duration));
    };
  };

  const saveTrainingData = async () => {
    if (!audioBlob || !transcript.trim() || !selectedDialect || !selectedLanguage) {
      toast.error("Please record audio, write transcript, and select language/dialect");
      return;
    }

    setIsSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to save training data");
        return;
      }

      // Upload audio to storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("training-audio")
        .upload(fileName, audioBlob);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload audio");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("training-audio")
        .getPublicUrl(fileName);

      // Save to training_data table
      const { error: insertError } = await supabase
        .from("training_data" as any)
        .insert({
          user_id: user.id,
          language_id: parseInt(selectedLanguage),
          dialect_id: parseInt(selectedDialect),
          audio_url: urlData.publicUrl,
          transcript: transcript.trim(),
          duration_seconds: recordingTime,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("Failed to save training data");
        return;
      }

      toast.success("Training data saved successfully!");
      discardRecording();
      queryClient.invalidateQueries({ queryKey: ["training-data", selectedDialect] });
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save training data");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Training Data Collector</CardTitle>
            <CardDescription>
              Record audio in your dialect and write the transcript to train the AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language & Dialect Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={selectedLanguage} onValueChange={(val) => {
                  setSelectedLanguage(val);
                  setSelectedDialect("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages?.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id.toString()}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dialect</Label>
                <Select value={selectedDialect} onValueChange={setSelectedDialect} disabled={!selectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dialect" />
                  </SelectTrigger>
                  <SelectContent>
                    {dialects?.map((dialect) => (
                      <SelectItem key={dialect.id} value={dialect.id.toString()}>
                        {dialect.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recording Section */}
            <div className="flex flex-col items-center gap-4 py-6 border rounded-lg bg-muted/30">
              {!audioBlob ? (
                <>
                  <div className="flex gap-6 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        size="lg"
                        variant={isRecording ? "destructive" : "default"}
                        onClick={isRecording ? stopRecording : startRecording}
                        className="rounded-full h-20 w-20"
                      >
                        {isRecording ? (
                          <Square className="h-8 w-8" />
                        ) : (
                          <Mic className="h-8 w-8" />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">Record</span>
                    </div>
                    
                    <span className="text-muted-foreground">or</span>
                    
                    <div className="flex flex-col items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="audio-upload"
                      />
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full h-20 w-20"
                        disabled={isRecording}
                      >
                        <FileAudio className="h-8 w-8" />
                      </Button>
                      <span className="text-sm text-muted-foreground">Upload</span>
                    </div>
                  </div>
                  
                  {isRecording && (
                    <>
                      <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                      <span className="text-sm text-muted-foreground animate-pulse">
                        Recording...
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={playPauseAudio}
                      className="rounded-full h-16 w-16"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={discardRecording}
                      className="rounded-full h-16 w-16 text-destructive"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Duration: {formatTime(recordingTime)}
                  </span>
                  {audioUrl && (
                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                  )}
                </>
              )}
            </div>

            {/* Transcript Section */}
            <div className="space-y-2">
              <Label>Transcript (Pashto Script - پښتو لیکنه)</Label>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="دلته خپله ثبت شوې خبره په پښتو لیکنه ولیکئ..."
                className="min-h-[150px] text-xl font-['Noto_Naskh_Arabic',_'Scheherazade_New',_serif]"
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground">
                Write exactly what you said in the audio using Pashto script (پښتو لیکنه)
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={saveTrainingData}
              disabled={!audioBlob || !transcript.trim() || !selectedDialect || isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Save Training Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* My Contributions */}
        {trainingData && trainingData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedDialect && dialects?.find(d => d.id.toString() === selectedDialect)?.name} Contributions
              </CardTitle>
              <CardDescription>
                {trainingData.length} recording{trainingData.length !== 1 ? 's' : ''} for this dialect
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio ref={listAudioRef} className="hidden" onEnded={() => setPlayingId(null)} />
              {trainingData.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (playingId === item.id) {
                            listAudioRef.current?.pause();
                            setPlayingId(null);
                          } else {
                            if (listAudioRef.current) {
                              listAudioRef.current.src = item.audio_url;
                              listAudioRef.current.play();
                              setPlayingId(item.id);
                            }
                          }
                        }}
                      >
                        {playingId === item.id ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {item.duration_seconds}s • {item.dialects?.name} • {item.languages?.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-lg font-['Noto_Naskh_Arabic',_'Scheherazade_New',_serif]" dir="rtl">
                    {item.transcript}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrainingDataCollector;
