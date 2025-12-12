import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import AudioRecorder from "@/components/AudioRecorder";
import AudioPlayer from "@/components/AudioPlayer";
import { toast } from "sonner";
import { Flame, Volume2, Check, ArrowRight, Upload, Sparkles } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";

interface SeedWord {
  id: string;
  word_urdu: string;
  word_english: string;
  category: string;
}

interface Language {
  id: number;
  name: string;
  native_name: string;
}

interface Dialect {
  id: number;
  name: string;
  language_id: number;
}

const DailyChallenge = () => {
  const navigate = useNavigate();
  const { checkAndAwardBadges } = useBadges();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyWords, setDailyWords] = useState<SeedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedDialect, setSelectedDialect] = useState<string>("");
  const [labelText, setLabelText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [category, setCategory] = useState<string>("all");
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  const categories = ["all", "family", "food", "nature", "body", "actions", "time", "weather", "emotions", "colors", "numbers", "animals"];

  useEffect(() => {
    checkAuth();
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDailyWords();
    }
  }, [user, category]);

  useEffect(() => {
    if (selectedLanguage && defaultsLoaded) {
      fetchDialects(parseInt(selectedLanguage));
    }
  }, [selectedLanguage, defaultsLoaded]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);

    // Load user's default language/dialect
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_language_id, default_dialect_id")
      .eq("id", user.id)
      .single();

    if (profile?.default_language_id) {
      setSelectedLanguage(profile.default_language_id.toString());
      // Fetch dialects for this language and set default
      const { data: dialectsData } = await supabase
        .from("dialects")
        .select("*")
        .eq("language_id", profile.default_language_id)
        .order("name");
      if (dialectsData) setDialects(dialectsData);
      if (profile.default_dialect_id) {
        setSelectedDialect(profile.default_dialect_id.toString());
      }
    }
    setDefaultsLoaded(true);
    setLoading(false);
  };

  const fetchLanguages = async () => {
    const { data } = await supabase.from("languages").select("*").order("name");
    if (data) setLanguages(data);
  };

  const fetchDialects = async (languageId: number) => {
    const { data } = await supabase
      .from("dialects")
      .select("*")
      .eq("language_id", languageId)
      .order("name");
    if (data) setDialects(data);
    // Only reset dialect if user changed language manually (not on initial load with defaults)
    if (defaultsLoaded && !dialects.some(d => d.id.toString() === selectedDialect)) {
      setSelectedDialect("");
    }
  };

  const fetchDailyWords = async () => {
    setLoading(true);
    
    // Get 10 random words for today's challenge
    let query = supabase.from("seed_words").select("*");
    
    if (category !== "all") {
      query = query.eq("category", category);
    }
    
    const { data } = await query.limit(10);
    
    if (data) {
      // Shuffle the words
      const shuffled = data.sort(() => Math.random() - 0.5);
      setDailyWords(shuffled);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = `upload_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `recordings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      toast.error("Failed to upload audio file");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);

    setAudioUrl(publicUrl);
    toast.success("Audio uploaded!");
  };

  const handleSubmit = async () => {
    if (!selectedDialect || !labelText.trim()) {
      toast.error("Please select your dialect and enter the word in your dialect");
      return;
    }

    setSubmitting(true);
    const currentWord = dailyWords[currentIndex];

    try {
      const { error } = await supabase.from("daily_labels").insert({
        user_id: user.id,
        seed_word_id: currentWord.id,
        dialect_id: parseInt(selectedDialect),
        label_text: labelText.trim(),
        audio_url: audioUrl
      });

      if (error) {
        if (error.code === '23505') {
          toast.error("You've already labeled this word in this dialect");
        } else {
          throw error;
        }
      } else {
        setCompletedCount(prev => prev + 1);
        toast.success(`+5 points! ${audioUrl ? '+3 bonus for audio!' : ''}`);
        
        // Check for badges
        await checkAndAwardBadges();

        // Move to next word or finish
        if (currentIndex < dailyWords.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setLabelText("");
          setAudioUrl(null);
        } else {
          toast.success("🎉 Daily challenge complete! Great work preserving dialects!");
        }
      }
    } catch (error) {
      console.error("Error submitting label:", error);
      toast.error("Failed to submit label");
    } finally {
      setSubmitting(false);
    }
  };

  const skipWord = () => {
    if (currentIndex < dailyWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setLabelText("");
      setAudioUrl(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading daily challenge...</div>
        </div>
      </div>
    );
  }

  const currentWord = dailyWords[currentIndex];
  const progress = ((currentIndex + 1) / dailyWords.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <div className="container max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h1 className="text-3xl font-bold">Daily Challenge</h1>
          </div>
          <p className="text-muted-foreground">
            Label words in your dialect to help AI understand Pakistani languages
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Word {currentIndex + 1} of {dailyWords.length}</span>
            <span className="text-primary font-medium">{completedCount} completed today</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => {
                setCategory(cat);
                setCurrentIndex(0);
              }}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {currentWord ? (
          <Card className="mb-6">
            <CardHeader className="text-center pb-4">
              <Badge variant="secondary" className="w-fit mx-auto mb-2 capitalize">
                {currentWord.category}
              </Badge>
              <CardTitle className="text-4xl font-bold text-primary" dir="rtl">
                {currentWord.word_urdu}
              </CardTitle>
              <CardDescription className="text-lg">
                {currentWord.word_english}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id.toString()}>
                          {lang.name} ({lang.native_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Dialect</label>
                  <Select 
                    value={selectedDialect} 
                    onValueChange={setSelectedDialect}
                    disabled={!selectedLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dialect" />
                    </SelectTrigger>
                    <SelectContent>
                      {dialects.map((dialect) => (
                        <SelectItem key={dialect.id} value={dialect.id.toString()}>
                          {dialect.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Label Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  How do you say this in your dialect?
                </label>
                <Input
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  placeholder="Enter the word in your dialect..."
                  className="text-lg"
                  dir="rtl"
                />
              </div>

              {/* Audio Section */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Record pronunciation (optional, +3 bonus points)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <AudioRecorder 
                    onAudioRecorded={setAudioUrl} 
                    disabled={submitting}
                  />
                  <span className="text-muted-foreground">or</span>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </span>
                    </Button>
                  </label>
                </div>
                {audioUrl && (
                  <div className="mt-3">
                    <AudioPlayer audioUrl={audioUrl} />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={skipWord}
                  disabled={currentIndex >= dailyWords.length - 1}
                  className="flex-1"
                >
                  Skip
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !labelText.trim() || !selectedDialect}
                  className="flex-1"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Submit (+5 pts)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">All Done!</h2>
              <p className="text-muted-foreground mb-4">
                You've completed today's words in this category. Try another category or come back tomorrow!
              </p>
              <Button onClick={() => setCategory("all")}>
                Try All Categories
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">💡 Tips for Quality Contributions</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use the exact word as spoken in your village/region</li>
              <li>• Record audio for better AI understanding</li>
              <li>• Include any accent variations you know</li>
              <li>• Your contributions help preserve endangered dialects!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyChallenge;
