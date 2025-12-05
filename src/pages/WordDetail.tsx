import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useBadges } from "@/hooks/useBadges";
import { cn } from "@/lib/utils";

const WordDetail = () => {
  const { id } = useParams();
  const [entry, setEntry] = useState<any>(null);
  const [audioEntries, setAudioEntries] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [votingId, setVotingId] = useState<string | null>(null);
  const { checkAndAwardBadges } = useBadges(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch entry details with language info
      const { data: entryData } = await supabase
        .from("entries")
        .select(`
          *,
          dialects (name, region, languages (name, native_name)),
          profiles (name)
        `)
        .eq("id", id)
        .single();

      if (entryData) setEntry(entryData);

      // Fetch audio entries
      const { data: audioData } = await supabase
        .from("audio_entries")
        .select("*")
        .eq("entry_id", id);

      if (audioData) setAudioEntries(audioData);

      // Fetch variant links
      const { data: variantData } = await supabase
        .from("variant_links")
        .select(`
          *,
          entry1:entries!variant_links_entry1_id_fkey (
            id, word, meaning_en, meaning_ur,
            dialects (name, languages (name))
          ),
          entry2:entries!variant_links_entry2_id_fkey (
            id, word, meaning_en, meaning_ur,
            dialects (name, languages (name))
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

  // Fetch user's existing votes
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user || variants.length === 0) return;

      const linkIds = variants.map((v) => v.linkId);
      const { data } = await supabase
        .from("votes")
        .select("variant_link_id, vote_type")
        .eq("user_id", user.id)
        .in("variant_link_id", linkIds);

      if (data) {
        const votesMap: Record<string, string> = {};
        data.forEach((v) => {
          if (v.variant_link_id) votesMap[v.variant_link_id] = v.vote_type;
        });
        setUserVotes(votesMap);
      }
    };

    fetchUserVotes();
  }, [user, variants]);

  const handleVote = async (linkId: string, voteType: "correct" | "incorrect") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    // Prevent voting if already voted the same way
    if (userVotes[linkId] === voteType) {
      toast.info("You've already voted this way");
      return;
    }

    setVotingId(linkId);

    try {
      const { error } = await supabase.from("votes").insert({
        user_id: user.id,
        variant_link_id: linkId,
        vote_type: voteType,
      });

      if (error) throw error;

      // Award points for voting
      await supabase.rpc("increment_user_points", {
        user_uuid: user.id,
        points_to_add: 1,
      });

      // Update local state
      setUserVotes((prev) => ({ ...prev, [linkId]: voteType }));

      // Update variant counts locally
      setVariants((prev) =>
        prev.map((v) => {
          if (v.linkId === linkId) {
            const oldVote = userVotes[linkId];
            let newUp = v.votesUp || 0;
            let newDown = v.votesDown || 0;

            // Remove old vote
            if (oldVote === "correct") newUp--;
            else if (oldVote === "incorrect") newDown--;

            // Add new vote
            if (voteType === "correct") newUp++;
            else newDown++;

            return { ...v, votesUp: newUp, votesDown: newDown };
          }
          return v;
        })
      );

      // Check for new badges
      await checkAndAwardBadges();

      toast.success("Vote recorded! +1 point");
    } catch (error: any) {
      toast.error(error.message || "Failed to record vote");
    } finally {
      setVotingId(null);
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.dialects?.languages && (
                        <Badge variant="default">
                          {entry.dialects.languages.native_name}
                        </Badge>
                      )}
                      <Badge variant="secondary">{entry.dialects?.name}</Badge>
                      <Badge variant="outline">{entry.dialects?.region}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">English Meaning</p>
                    <p className="text-lg font-medium">{entry.meaning_en}</p>
                  </div>
                  <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">اردو معنی</p>
                    <p className="text-lg font-medium" dir="rtl">
                      {entry.meaning_ur}
                    </p>
                  </div>
                </div>

                {entry.example_sentence && (
                  <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
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
                  {variants.map((variant) => {
                    const userVote = userVotes[variant.linkId];
                    return (
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
                            <div className="flex gap-2">
                              {variant.dialects?.languages && (
                                <Badge variant="secondary" className="text-xs">
                                  {variant.dialects.languages.name}
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {variant.dialects?.name}
                              </p>
                            </div>
                            <p className="text-sm">{variant.meaning_en}</p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userVote === "correct" ? "default" : "outline"}
                            onClick={() => handleVote(variant.linkId, "correct")}
                            disabled={votingId === variant.linkId}
                            className={cn(
                              userVote === "correct" && "bg-success hover:bg-success/90"
                            )}
                          >
                            {userVote === "correct" ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <ThumbsUp className="h-3 w-3 mr-1" />
                            )}
                            {variant.votesUp || 0}
                          </Button>
                          <Button
                            size="sm"
                            variant={userVote === "incorrect" ? "default" : "outline"}
                            onClick={() => handleVote(variant.linkId, "incorrect")}
                            disabled={votingId === variant.linkId}
                            className={cn(
                              userVote === "incorrect" && "bg-destructive hover:bg-destructive/90"
                            )}
                          >
                            {userVote === "incorrect" ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <ThumbsDown className="h-3 w-3 mr-1" />
                            )}
                            {variant.votesDown || 0}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {variants.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No dialect variants linked yet.</p>
                  <p className="text-sm mt-2">
                    Variants will be suggested as more words are added.
                  </p>
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
