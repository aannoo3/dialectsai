import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BadgeIcon from "@/components/BadgeIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Flame, BookOpen, Mic } from "lucide-react";

interface Contributor {
  id: string;
  name: string;
  email: string;
  points: number;
  words_added: number;
  audio_uploaded: number;
  votes_cast: number;
  streak_days: number;
  created_at: string;
  badges?: { badge_id: number; badges: { icon: string; name: string } }[];
}

const Leaderboard = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, points, words_added, audio_uploaded, votes_cast, streak_days, created_at")
        .order("points", { ascending: false })
        .limit(50);

      if (profiles) {
        // Fetch badges for each user
        const userIds = profiles.map((p) => p.id);
        const { data: userBadges } = await supabase
          .from("user_badges")
          .select("user_id, badge_id, badges (icon, name)")
          .in("user_id", userIds);

        const contributorsWithBadges = profiles.map((profile) => ({
          ...profile,
          badges: userBadges?.filter((ub) => ub.user_id === profile.id) || [],
        }));

        setContributors(contributorsWithBadges as Contributor[]);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
    if (index === 1) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
    if (index === 2) return "bg-gradient-to-br from-amber-400 to-amber-600 text-white";
    return "bg-muted text-foreground";
  };

  const ContributorCard = ({ contributor, index }: { contributor: Contributor; index: number }) => (
    <Card className={index < 3 ? "shadow-lg border-2 border-primary/20" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${getRankBadge(index)}`}
            >
              {index < 3 ? getRankIcon(index) : index + 1}
            </div>
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {contributor.name?.charAt(0).toUpperCase() ||
                  contributor.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {contributor.name || "Anonymous"}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {contributor.words_added}
                </span>
                <span className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  {contributor.audio_uploaded}
                </span>
                {contributor.streak_days > 0 && (
                  <span className="flex items-center gap-1 text-warning">
                    <Flame className="h-3 w-3" />
                    {contributor.streak_days}
                  </span>
                )}
              </div>
              {contributor.badges && contributor.badges.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {contributor.badges.slice(0, 5).map((ub, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"
                      title={ub.badges.name}
                    >
                      <BadgeIcon icon={ub.badges.icon} className="h-3 w-3 text-primary" />
                    </div>
                  ))}
                  {contributor.badges.length > 5 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      +{contributor.badges.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-primary">{contributor.points}</p>
            <p className="text-sm text-muted-foreground">points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground text-lg">
              Top contributors preserving linguistic heritage
            </p>
            <Button variant="outline" asChild>
              <Link to="/badges">
                <Award className="h-4 w-4 mr-2" />
                View All Badges
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="points" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="points">By Points</TabsTrigger>
              <TabsTrigger value="words">By Words</TabsTrigger>
              <TabsTrigger value="audio">By Audio</TabsTrigger>
            </TabsList>
            <TabsContent value="points" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : contributors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No contributors yet. Be the first!
                </div>
              ) : (
                contributors.map((contributor, index) => (
                  <ContributorCard key={contributor.id} contributor={contributor} index={index} />
                ))
              )}
            </TabsContent>
            <TabsContent value="words" className="space-y-4 mt-6">
              {[...contributors]
                .sort((a, b) => b.words_added - a.words_added)
                .map((contributor, index) => (
                  <ContributorCard key={contributor.id} contributor={contributor} index={index} />
                ))}
            </TabsContent>
            <TabsContent value="audio" className="space-y-4 mt-6">
              {[...contributors]
                .sort((a, b) => b.audio_uploaded - a.audio_uploaded)
                .map((contributor, index) => (
                  <ContributorCard key={contributor.id} contributor={contributor} index={index} />
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
