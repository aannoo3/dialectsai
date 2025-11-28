import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AudioPlayer from "@/components/AudioPlayer";
import WordCard from "@/components/WordCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const WordDetail = () => {
  const { id } = useParams();
  const [entry, setEntry] = useState<any>(null);
  const [audioEntries, setAudioEntries] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });

    const fetchData = async () => {
      if (!id) return;

      // Fetch entry details
      const { data: entryData } = await supabase
        .from("entries")
        .select(`
          *,
          dialects (name, region),
          profiles (name)
        `)
        .eq("id", id)
        .single();

      if (entryData) {
        setEntry(entryData);
      }

      // Fetch audio entries
      const { data: audioData } = await supabase
        .from("audio_entries")
        .select("*")
        .eq("entry_id", id);

      if (audioData) {
        setAudioEntries(audioData);
      }

      // Fetch variant links
      const { data: variantData } = await supabase
        .from("variant_links")
        .select(`
          *,
          entry1:entries!variant_links_entry1_id_fkey (
            id, word, meaning_en, meaning_ur,
            dialects (name)
          ),
          entry2:entries!variant_links_entry2_id_fkey (
            id, word, meaning_en, meaning_ur,
            dialects (name)
          )
        `)
        .or(`entry1_id.eq.${id},entry2_id.eq.${id}`);

      if (variantData) {
        const mappedVariants = variantData.map((v) => {
          const otherEntry = v.entry1_id === id ? v.entry2 : v.entry1;
          return {
            ...otherEntry,
            confidence: v.confidence_score,
            votesUp: v.votes_up,
            votesDown: v.votes_down,
            linkId: v.id,
          };
        });
        setVariants(mappedVariants);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleVote = async (linkId: string, voteType: "correct" | "incorrect") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const { error } = await supabase.from("votes").upsert({
        user_id: user.id,
        variant_link_id: linkId,
        vote_type: voteType,
      });

      if (error) throw error;

      // Update the vote count
      const { error: updateError } = await supabase.rpc("increment_user_points", {
        user_uuid: user.id,
        points_to_add: 1,
      });

      if (updateError) throw updateError;

      toast.success("Vote recorded! +1 point");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to record vote");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Word not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dialect-mapper">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mapper
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold" dir="rtl">
                      {entry.word}
                    </h1>
                    <Badge variant="secondary">{entry.dialects?.name}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">English Meaning</p>
                    <p className="text-lg font-medium">{entry.meaning_en}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">اردو معنی</p>
                    <p className="text-lg font-medium" dir="rtl">
                      {entry.meaning_ur}
                    </p>
                  </div>
                </div>

                {entry.example_sentence && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Example Sentence</p>
                    <p className="text-base" dir="rtl">
                      {entry.example_sentence}
                    </p>
                  </div>
                )}

                {audioEntries.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Audio Pronunciations</p>
                    <div className="flex flex-wrap gap-2">
                      {audioEntries.map((audio) => (
                        <AudioPlayer
                          key={audio.id}
                          audioUrl={audio.audio_url}
                          accent={audio.accent}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border text-sm text-muted-foreground">
                  Contributed by {entry.profiles?.name || "Anonymous"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dialect Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="space-y-3 pb-4 border-b last:border-0"
                    >
                      <Link to={`/word/${variant.id}`}>
                        <div className="space-y-1 hover:opacity-80 transition-opacity">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg" dir="rtl">
                              {variant.word}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {Math.round((variant.confidence || 0) * 100)}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {variant.dialects?.name}
                          </p>
                          <p className="text-sm">{variant.meaning_en}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(variant.linkId, "correct")}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {variant.votesUp || 0}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(variant.linkId, "incorrect")}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {variant.votesDown || 0}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDetail;