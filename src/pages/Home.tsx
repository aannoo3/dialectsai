import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import WordCard from "@/components/WordCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Map, Trophy, Users, BookOpen, Mic } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch recent entries
      const { data: entries } = await supabase
        .from("entries")
        .select(`
          id,
          word,
          meaning_en,
          meaning_ur,
          dialects (name),
          audio_entries (id)
        `)
        .order("created_at", { ascending: false })
        .limit(6);

      if (entries) {
        setRecentEntries(entries);
      }

      // Fetch top contributors
      const { data: contributors } = await supabase
        .from("profiles")
        .select("name, points")
        .order("points", { ascending: false })
        .limit(5);

      if (contributors) {
        setTopContributors(contributors);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Preserve, Connect & Understand{" "}
              <span className="text-primary">Dialects</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join a community-driven platform preserving linguistic heritage across Pakistan.
              Contribute words, map dialects, and help build the first dialect-centric AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {user ? (
                <>
                  <Button size="lg" asChild>
                    <Link to="/add-word">
                      <Plus className="mr-2 h-5 w-5" />
                      Start Contributing
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/dialect-mapper">
                      <Map className="mr-2 h-5 w-5" />
                      Explore Dialects
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/dialect-mapper">Explore Dialects</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why DialectAI?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Preserve Heritage</h3>
                <p className="text-muted-foreground">
                  Document dialects before they disappear. Every word you add helps preserve
                  linguistic diversity for future generations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Map className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Map Connections</h3>
                <p className="text-muted-foreground">
                  Discover how words change across regions. AI-powered mapping shows linguistic
                  relationships between dialects.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold">Audio Pronunciations</h3>
                <p className="text-muted-foreground">
                  Hear authentic pronunciations from native speakers. Build a living audio
                  archive of dialects.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Recent Contributions</h2>
              <Button variant="ghost" asChild>
                <Link to="/dialect-mapper">View All →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentEntries.slice(0, 6).map((entry) => (
                <WordCard
                  key={entry.id}
                  id={entry.id}
                  word={entry.word}
                  dialect={entry.dialects?.name || "Unknown"}
                  meaningEn={entry.meaning_en}
                  meaningUr={entry.meaning_ur}
                  hasAudio={entry.audio_entries?.length > 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Top Contributors</h2>
                <Button variant="ghost" asChild>
                  <Link to="/leaderboard">
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{contributor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {contributor.points} points
                          </p>
                        </div>
                      </div>
                      <Trophy className="h-5 w-5 text-accent" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;