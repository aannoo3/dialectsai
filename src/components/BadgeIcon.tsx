import {
  BookOpen,
  Mic,
  Shield,
  Trophy,
  Crown,
  Volume2,
  Radio,
  Star,
  Users,
  Flame,
  Zap,
  Award,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Mic,
  Shield,
  Trophy,
  Crown,
  Volume2,
  Radio,
  Star,
  Users,
  Flame,
  Zap,
  Award,
};

interface BadgeIconProps {
  icon: string;
  className?: string;
}

const BadgeIcon = ({ icon, className = "h-5 w-5" }: BadgeIconProps) => {
  const Icon = iconMap[icon] || Award;
  return <Icon className={className} />;
};

export default BadgeIcon;
