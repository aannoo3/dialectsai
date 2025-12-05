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
import { Search, Filter, Globe } from "lucide-react";

const DialectMapper = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [dialects, setDialects] = useState<any[]>([]);
  const [filteredDialects, setFilteredDialects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedDialect, setSelectedDialect] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [languagesRes, dialectsRes] = await Promise.all([
        supabase.from("languages").select("*").order("name"),
        supabase.from("dialects").select("*").order("name"),
      ]);
      if (languagesRes.data) setLanguages(languagesRes.data);
      if (dialectsRes.data) setDialects(dialectsRes.data);
    };
    fetchData();
    fetchEntries();
  }, []);

  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== "all") {
      setFilteredDialects(dialects.filter(d => d.language_id === parseInt(selectedLanguage)));
      setSelectedDialect("all");
    } else {
      setFilteredDialects([]);
    }
  }, [selectedLanguage, dialects]);

  const fetchEntries = async (search?: string, langId?: string, dialectId?: string) => {
    setLoading(true);
    let query = supabase
      .from("entries")
      .select(`id, word, meaning_en, meaning_ur, dialects (id, name, language_id, languages (name, native_name)), audio_entries (id)`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (search) query = query.or(`word.ilike.%${search}%,meaning_en.ilike.%${search}%,meaning_ur.ilike.%${search}%`);
    if (dialectId && dialectId !== "all") query = query.eq("dialect_id", parseInt(dialectId));

    const { data } = await query;
    if (data) {
      let filtered = data;
      if (langId && langId !== "all" && (!dialectId || dialectId === "all")) {
        filtered = data.filter(e => e.dialects?.language_id === parseInt(langId));
      }
      setEntries(filtered);
    }
    setLoading(false);
  };

  const handleSearch = () => fetchEntries(searchTerm, selectedLanguage, selectedDialect);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Dialect Mapper</h1>
          <p className="text-muted-foreground text-lg">Explore words across Pakistan's linguistic tapestry</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search words..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} className="pl-10" />
            </div>
            <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2" />Search</Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="md:w-[200px]"><Globe className="h-4 w-4 mr-2" /><SelectValue placeholder="All Languages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.native_name} ({l.name})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedDialect} onValueChange={setSelectedDialect} disabled={selectedLanguage === "all"}>
              <SelectTrigger className="md:w-[200px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="All Dialects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dialects</SelectItem>
                {filteredDialects.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No words found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(e => <WordCard key={e.id} id={e.id} word={e.word} dialect={e.dialects?.name || "Unknown"} language={e.dialects?.languages?.name} meaningEn={e.meaning_en} meaningUr={e.meaning_ur} hasAudio={e.audio_entries?.length > 0} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DialectMapper;
