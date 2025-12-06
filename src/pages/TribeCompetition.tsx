import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  BookOpen, 
  Mic, 
  Tag,
  Flame,
  Calendar
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface DialectStats {
  dialect_id: number;
  dialect_name: string;
  region: string | null;
  total_words: number;
  total_audio: number;
  total_labels: number;
  total_points: number;
  contributor_count: number;
}

interface TopContributor {
  user_id: string;
  user_name: string;
  dialect_name: string;
  points_earned: number;
  words_added: number;
  audio_uploaded: number;
  labels_added: number;
}

const TribeCompetition = () => {
  const [dialectStats, setDialectStats] = useState<DialectStats[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    fetchCompetitionData();
  }, [weekStart]);

  const fetchCompetitionData = async () => {
    setLoading(true);
    const weekStartStr = format(weekStart, "yyyy-MM-dd");

    // Fetch dialect aggregate stats for the week
    const { data: weeklyStats } = await supabase
      .from("weekly_dialect_stats")
      .select(`
        dialect_id,
        words_added,
        audio_uploaded,
        labels_added,
        points_earned,
        user_id,
        dialects (name, region)
      `)
      .eq("week_start", weekStartStr);

    if (weeklyStats) {
      // Aggregate by dialect
      const dialectMap = new Map<number, DialectStats>();
      const contributors = new Set<string>();

      weeklyStats.forEach((stat: any) => {
        const dialectId = stat.dialect_id;
        const existing = dialectMap.get(dialectId);
        
        if (existing) {
          existing.total_words += stat.words_added || 0;
          existing.total_audio += stat.audio_uploaded || 0;
          existing.total_labels += stat.labels_added || 0;
          existing.total_points += stat.points_earned || 0;
          existing.contributor_count += 1;
        } else {
          dialectMap.set(dialectId, {
            dialect_id: dialectId,
            dialect_name: stat.dialects?.name || "Unknown",
            region: stat.dialects?.region,
            total_words: stat.words_added || 0,
            total_audio: stat.audio_uploaded || 0,
            total_labels: stat.labels_added || 0,
            total_points: stat.points_earned || 0,
            contributor_count: 1,
          });
        }
      });

      const sortedDialects = Array.from(dialectMap.values()).sort(
        (a, b) => b.total_points - a.total_points
      );
      setDialectStats(sortedDialects);
    }

    // Fetch top individual contributors for the week
    const { data: topUsers } = await supabase
      .from("weekly_dialect_stats")
      .select(`
        user_id,
        dialect_id,
        words_added,
        audio_uploaded,
        labels_added,
        points_earned,
        profiles (name),
        dialects (name)
      `)
      .eq("week_start", weekStartStr)
      .order("points_earned", { ascending: false })
      .limit(10);

    if (topUsers) {
      const contributors: TopContributor[] = topUsers.map((user: any) => ({
        user_id: user.user_id,
        user_name: user.profiles?.name || "Anonymous",
        dialect_name: user.dialects?.name || "Unknown",
        points_earned: user.points_earned || 0,
        words_added: user.words_added || 0,
        audio_uploaded: user.audio_uploaded || 0,
        labels_added: user.labels_added || 0,
      }));
      setTopContributors(contributors);
    }

    setLoading(false);
  };

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

  const maxPoints = dialectStats[0]?.total_points || 1;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Flame className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Tribe Competition</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Dialect tribes competing to preserve their linguistic heritage
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Week of {format(weekStart, "MMM d")} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <Tabs defaultValue="tribes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tribes">
                <Users className="h-4 w-4 mr-2" />
                Tribe Rankings
              </TabsTrigger>
              <TabsTrigger value="contributors">
                <Trophy className="h-4 w-4 mr-2" />
                Top Contributors
              </TabsTrigger>
            </TabsList>

            {/* Tribe Rankings Tab */}
            <TabsContent value="tribes" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : dialectStats.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Competition Data Yet</h3>
                  <p className="text-muted-foreground">
                    Start contributing to your dialect to begin the competition!
                  </p>
                </Card>
              ) : (
                dialectStats.map((dialect, index) => (
                  <Card 
                    key={dialect.dialect_id} 
                    className={index < 3 ? "shadow-lg border-2 border-primary/20" : ""}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div
                          className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${getRankBadge(index)}`}
                        >
                          {index < 3 ? getRankIcon(index) : index + 1}
                        </div>

                        {/* Dialect Info */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-xl">{dialect.dialect_name}</h3>
                              {dialect.region && (
                                <p className="text-sm text-muted-foreground">{dialect.region}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-primary">{dialect.total_points}</p>
                              <p className="text-sm text-muted-foreground">points</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <Progress 
                            value={(dialect.total_points / maxPoints) * 100} 
                            className="h-2"
                          />

                          {/* Stats */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <Badge variant="secondary" className="gap-1">
                              <Users className="h-3 w-3" />
                              {dialect.contributor_count} contributors
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <BookOpen className="h-3 w-3" />
                              {dialect.total_words} words
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Mic className="h-3 w-3" />
                              {dialect.total_audio} audio
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Tag className="h-3 w-3" />
                              {dialect.total_labels} labels
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Top Contributors Tab */}
            <TabsContent value="contributors" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : topContributors.length === 0 ? (
                <Card className="p-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Contributors Yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to contribute this week!
                  </p>
                </Card>
              ) : (
                topContributors.map((contributor, index) => (
                  <Card 
                    key={`${contributor.user_id}-${index}`}
                    className={index < 3 ? "shadow-lg border-2 border-primary/20" : ""}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center font-bold shrink-0 ${getRankBadge(index)}`}
                        >
                          {index < 3 ? getRankIcon(index) : index + 1}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {contributor.user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {contributor.user_name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {contributor.dialect_name}
                          </Badge>
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {contributor.words_added}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mic className="h-3 w-3" />
                              {contributor.audio_uploaded}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {contributor.labels_added}
                            </span>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-primary">
                            {contributor.points_earned}
                          </p>
                          <p className="text-sm text-muted-foreground">points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TribeCompetition;