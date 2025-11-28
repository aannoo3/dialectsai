import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import WordCard from "@/components/WordCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

const DialectMapper = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [dialects, setDialects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDialect, setSelectedDialect] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDialects = async () => {
      const { data } = await supabase.from("dialects").select("*").order("name");
      if (data) setDialects(data);
    };

    fetchDialects();
    fetchEntries();
  }, []);

  const fetchEntries = async (search?: string, dialectId?: string) => {
    setLoading(true);
    let query = supabase
      .from("entries")
      .select(`
        id,
        word,
        meaning_en,
        meaning_ur,
        dialects (name),
        audio_entries (id)
      `)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `word.ilike.%${search}%,meaning_en.ilike.%${search}%,meaning_ur.ilike.%${search}%`
      );
    }

    if (dialectId && dialectId !== "all") {
      query = query.eq("dialect_id", parseInt(dialectId));
    }

    const { data } = await query;
    if (data) setEntries(data);
    setLoading(false);
  };

  const handleSearch = () => {
    fetchEntries(searchTerm, selectedDialect);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Dialect Mapper</h1>
            <p className="text-muted-foreground text-lg">
              Search and explore words across different dialects
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDialect} onValueChange={setSelectedDialect}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Dialects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dialects</SelectItem>
                {dialects.map((dialect) => (
                  <SelectItem key={dialect.id} value={dialect.id.toString()}>
                    {dialect.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No entries found. Be the first to contribute!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map((entry) => (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DialectMapper;