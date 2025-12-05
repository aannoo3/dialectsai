import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
}

export interface UserBadge {
  id: string;
  badge_id: number;
  earned_at: string;
  badges: Badge;
}

export const useBadges = (userId?: string) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_value");
      
      if (data) setBadges(data);
    };

    fetchBadges();
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserBadges = async () => {
      const { data } = await supabase
        .from("user_badges")
        .select(`*, badges (*)`)
        .eq("user_id", userId);
      
      if (data) setUserBadges(data as UserBadge[]);
      setLoading(false);
    };

    fetchUserBadges();
  }, [userId]);

  const checkAndAwardBadges = async () => {
    if (!userId) return;
    
    try {
      await supabase.rpc("check_and_award_badges", { p_user_id: userId });
      
      // Refetch user badges
      const { data } = await supabase
        .from("user_badges")
        .select(`*, badges (*)`)
        .eq("user_id", userId);
      
      if (data) {
        const newBadges = data.filter(
          (b) => !userBadges.find((ub) => ub.badge_id === b.badge_id)
        );
        
        if (newBadges.length > 0) {
          newBadges.forEach((badge: any) => {
            toast.success(`🏆 New Badge: ${badge.badges.name}!`, {
              description: badge.badges.description,
            });
          });
        }
        
        setUserBadges(data as UserBadge[]);
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  };

  return {
    badges,
    userBadges,
    loading,
    checkAndAwardBadges,
    hasBadge: (badgeId: number) => userBadges.some((ub) => ub.badge_id === badgeId),
  };
};
