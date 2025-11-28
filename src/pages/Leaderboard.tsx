import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const [contributors, setContributors] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, email, points, created_at")
        .order("points", { ascending: false })
        .limit(50);

      if (data) setContributors(data);
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
    if (index === 1) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
    if (index === 2) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
    return "bg-muted text-foreground";
  };

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
          </div>

          {contributors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No contributors yet. Be the first!
            </div>
          ) : (
            <div className="space-y-4">
              {contributors.map((contributor, index) => (
                <Card
                  key={index}
                  className={`${
                    index < 3
                      ? "shadow-[var(--shadow-medium)] border-2"
                      : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(
                            index
                          )}`}
                        >
                          {index < 3 ? getRankIcon(index) : index + 1}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {contributor.name?.charAt(0).toUpperCase() ||
                              contributor.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {contributor.name || "Anonymous"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Member since{" "}
                            {new Date(contributor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {contributor.points}
                        </p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;