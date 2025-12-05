import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BadgeIcon from "@/components/BadgeIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { useBadges } from "@/hooks/useBadges";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const Badges = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const { badges, userBadges, loading } = useBadges(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("words_added, audio_uploaded, votes_cast, streak_days, points")
        .eq("id", user.id)
        .single();

      if (data) setUserStats(data);
    };

    fetchUserStats();
  }, [user]);

  const getProgress = (badge: any) => {
    if (!userStats) return 0;
    const current = userStats[badge.requirement_type] || 0;
    return Math.min((current / badge.requirement_value) * 100, 100);
  };

  const getCurrentValue = (badge: any) => {
    if (!userStats) return 0;
    return userStats[badge.requirement_type] || 0;
  };

  const hasBadge = (badgeId: number) => 
    userBadges.some((ub) => ub.badge_id === badgeId);

  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  const categoryLabels: Record<string, string> = {
    contribution: "Contribution Badges",
    engagement: "Engagement Badges",
    streak: "Streak Badges",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold">Badges & Achievements</h1>
            <p className="text-muted-foreground text-lg">
              Earn badges by contributing to the platform
            </p>
          </div>

          {user && userStats && (
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-3xl font-bold text-primary">{userStats.words_added}</p>
                    <p className="text-sm text-muted-foreground">Words Added</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-3xl font-bold text-accent">{userStats.audio_uploaded}</p>
                    <p className="text-sm text-muted-foreground">Audio Uploaded</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-3xl font-bold text-success">{userStats.votes_cast}</p>
                    <p className="text-sm text-muted-foreground">Votes Cast</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-3xl font-bold text-warning">{userStats.streak_days}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card className="bg-muted/50">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Sign in to track your badge progress and earn achievements!
                </p>
              </CardContent>
            </Card>
          )}

          {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-2xl font-semibold">{categoryLabels[category] || category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryBadges.map((badge) => {
                  const earned = hasBadge(badge.id);
                  const progress = getProgress(badge);
                  const current = getCurrentValue(badge);

                  return (
                    <Card
                      key={badge.id}
                      className={cn(
                        "transition-all",
                        earned
                          ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30"
                          : "opacity-70"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "h-14 w-14 rounded-xl flex items-center justify-center",
                              earned
                                ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <BadgeIcon icon={badge.icon} className="h-7 w-7" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{badge.name}</h3>
                              {earned && (
                                <BadgeUI variant="default" className="bg-success">
                                  Earned!
                                </BadgeUI>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {badge.description}
                            </p>
                            {user && !earned && (
                              <div className="space-y-1">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {current} / {badge.requirement_value}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-primary font-medium">
                              +{badge.points_reward} points reward
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Badges;
