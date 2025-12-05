import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, Globe } from "lucide-react";

interface WordCardProps {
  id: string;
  word: string;
  dialect: string;
  language?: string;
  meaningEn: string;
  meaningUr: string;
  hasAudio?: boolean;
}

const WordCard = ({ id, word, dialect, language, meaningEn, meaningUr, hasAudio }: WordCardProps) => (
  <Link to={`/word/${id}`}>
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-2xl font-bold group-hover:text-primary transition-colors" dir="rtl">{word}</h3>
          {hasAudio && <Volume2 className="h-5 w-5 text-primary shrink-0" />}
        </div>
        <div className="flex flex-wrap gap-2">
          {language && <Badge variant="default" className="text-xs"><Globe className="h-3 w-3 mr-1" />{language}</Badge>}
          <Badge variant="secondary" className="text-xs">{dialect}</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm">{meaningEn}</p>
          <p className="text-sm text-muted-foreground" dir="rtl">{meaningUr}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default WordCard;
