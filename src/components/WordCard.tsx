import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";

interface WordCardProps {
  id: string;
  word: string;
  dialect: string;
  meaningEn: string;
  meaningUr: string;
  hasAudio?: boolean;
  votesUp?: number;
  votesDown?: number;
}

const WordCard = ({
  id,
  word,
  dialect,
  meaningEn,
  meaningUr,
  hasAudio = false,
  votesUp = 0,
  votesDown = 0,
}: WordCardProps) => {
  return (
    <Link to={`/word/${id}`}>
      <Card className="hover:shadow-[var(--shadow-medium)] transition-shadow cursor-pointer bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-foreground" dir="rtl">
                {word}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {dialect}
              </Badge>
            </div>
            {hasAudio && (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Volume2 className="h-4 w-4 text-accent" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">English:</p>
            <p className="font-medium">{meaningEn}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">اردو:</p>
            <p className="font-medium" dir="rtl">
              {meaningUr}
            </p>
          </div>
          <div className="flex items-center space-x-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{votesUp}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ThumbsDown className="h-3 w-3" />
              <span>{votesDown}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default WordCard;