import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { User } from "@supabase/supabase-js";

const AddWord = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialects, setDialects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    word: "",
    dialectId: "",
    meaningUr: "",
    meaningEn: "",
    exampleSentence: "",
    script: "Pashto",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const fetchDialects = async () => {
      const { data } = await supabase.from("dialects").select("*").order("name");
      if (data) setDialects(data);
    };

    fetchDialects();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Insert entry
      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .insert({
          word: formData.word,
          dialect_id: parseInt(formData.dialectId),
          meaning_ur: formData.meaningUr,
          meaning_en: formData.meaningEn,
          example_sentence: formData.exampleSentence || null,
          script: formData.script,
          created_by: user.id,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Upload audio if provided
      if (audioFile && entry) {
        const fileExt = audioFile.name.split(".").pop();
        const fileName = `${entry.id}.${fileExt}`;
        const filePath = `audio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("audio")
          .upload(filePath, audioFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("audio")
          .getPublicUrl(filePath);

        const { error: audioError } = await supabase.from("audio_entries").insert({
          entry_id: entry.id,
          audio_url: publicUrl,
          uploaded_by: user.id,
        });

        if (audioError) throw audioError;
      }

      // Award points
      await supabase.rpc("increment_user_points", {
        user_uuid: user.id,
        points_to_add: 10,
      });

      toast.success("Word added successfully! +10 points");
      navigate(`/word/${entry.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add word");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Add New Word</CardTitle>
              <CardDescription>
                Contribute to the dialect database. Earn 10 points for each word added!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dialect">Dialect *</Label>
                  <Select
                    value={formData.dialectId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dialectId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a dialect" />
                    </SelectTrigger>
                    <SelectContent>
                      {dialects.map((dialect) => (
                        <SelectItem key={dialect.id} value={dialect.id.toString()}>
                          {dialect.name} ({dialect.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="word">Word *</Label>
                  <Input
                    id="word"
                    value={formData.word}
                    onChange={(e) =>
                      setFormData({ ...formData, word: e.target.value })
                    }
                    placeholder="Enter the word in native script"
                    required
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meaningUr">Meaning (Urdu) *</Label>
                  <Input
                    id="meaningUr"
                    value={formData.meaningUr}
                    onChange={(e) =>
                      setFormData({ ...formData, meaningUr: e.target.value })
                    }
                    placeholder="اردو میں معنی"
                    required
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meaningEn">Meaning (English) *</Label>
                  <Input
                    id="meaningEn"
                    value={formData.meaningEn}
                    onChange={(e) =>
                      setFormData({ ...formData, meaningEn: e.target.value })
                    }
                    placeholder="Meaning in English"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exampleSentence">Example Sentence (Optional)</Label>
                  <Textarea
                    id="exampleSentence"
                    value={formData.exampleSentence}
                    onChange={(e) =>
                      setFormData({ ...formData, exampleSentence: e.target.value })
                    }
                    placeholder="Use the word in a sentence"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio">Audio Recording (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="audio"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload audio pronunciation for +5 bonus points
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Word
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddWord;