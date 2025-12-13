import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Languages, Map, FileText, Shield } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });

      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  // Fetch languages
  const { data: languages } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch dialects with language info
  const { data: dialects } = useQuery({
    queryKey: ["admin-dialects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dialects")
        .select("*, languages(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch seed words
  const { data: seedWords } = useQuery({
    queryKey: ["admin-seed-words"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seed_words")
        .select("*")
        .order("word_english");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage languages, dialects, and seed words</p>
          </div>
        </div>

        <Tabs defaultValue="languages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="languages" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Languages
            </TabsTrigger>
            <TabsTrigger value="dialects" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Dialects
            </TabsTrigger>
            <TabsTrigger value="seed-words" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Seed Words
            </TabsTrigger>
          </TabsList>

          <TabsContent value="languages">
            <LanguagesTab languages={languages || []} queryClient={queryClient} />
          </TabsContent>

          <TabsContent value="dialects">
            <DialectsTab dialects={dialects || []} languages={languages || []} queryClient={queryClient} />
          </TabsContent>

          <TabsContent value="seed-words">
            <SeedWordsTab seedWords={seedWords || []} queryClient={queryClient} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Languages Tab Component
const LanguagesTab = ({ languages, queryClient }: { languages: any[]; queryClient: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    native_name: "",
    region: "",
    iso_code: "",
    speakers_estimate: "",
  });

  const resetForm = () => {
    setFormData({ name: "", native_name: "", region: "", iso_code: "", speakers_estimate: "" });
    setEditingLanguage(null);
  };

  const openEdit = (language: any) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      native_name: language.native_name,
      region: language.region || "",
      iso_code: language.iso_code || "",
      speakers_estimate: language.speakers_estimate || "",
    });
    setIsOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingLanguage) {
        const { error } = await supabase
          .from("languages")
          .update(formData)
          .eq("id", editingLanguage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("languages").insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-languages"] });
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      toast.success(editingLanguage ? "Language updated" : "Language added");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("languages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-languages"] });
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      toast.success("Language deleted");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Languages</CardTitle>
          <CardDescription>{languages.length} languages configured</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Language</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLanguage ? "Edit Language" : "Add Language"}</DialogTitle>
              <DialogDescription>Configure language details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (English)</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Pashto" />
                </div>
                <div className="space-y-2">
                  <Label>Native Name</Label>
                  <Input value={formData.native_name} onChange={(e) => setFormData({ ...formData, native_name: e.target.value })} placeholder="پښتو" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="Pakistan, Afghanistan" />
                </div>
                <div className="space-y-2">
                  <Label>ISO Code</Label>
                  <Input value={formData.iso_code} onChange={(e) => setFormData({ ...formData, iso_code: e.target.value })} placeholder="ps" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Speakers Estimate</Label>
                <Input value={formData.speakers_estimate} onChange={(e) => setFormData({ ...formData, speakers_estimate: e.target.value })} placeholder="40-60 million" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!formData.name || !formData.native_name}>
                {editingLanguage ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Native Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>ISO Code</TableHead>
              <TableHead>Speakers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.map((lang) => (
              <TableRow key={lang.id}>
                <TableCell className="font-medium">{lang.name}</TableCell>
                <TableCell>{lang.native_name}</TableCell>
                <TableCell>{lang.region}</TableCell>
                <TableCell>{lang.iso_code}</TableCell>
                <TableCell>{lang.speakers_estimate}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(lang)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(lang.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Dialects Tab Component
const DialectsTab = ({ dialects, languages, queryClient }: { dialects: any[]; languages: any[]; queryClient: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDialect, setEditingDialect] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    iso_code: "",
    language_id: "",
  });

  const resetForm = () => {
    setFormData({ name: "", region: "", iso_code: "", language_id: "" });
    setEditingDialect(null);
  };

  const openEdit = (dialect: any) => {
    setEditingDialect(dialect);
    setFormData({
      name: dialect.name,
      region: dialect.region || "",
      iso_code: dialect.iso_code || "",
      language_id: dialect.language_id?.toString() || "",
    });
    setIsOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        language_id: formData.language_id ? parseInt(formData.language_id) : null,
      };
      if (editingDialect) {
        const { error } = await supabase.from("dialects").update(payload).eq("id", editingDialect.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dialects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dialects"] });
      queryClient.invalidateQueries({ queryKey: ["dialects"] });
      toast.success(editingDialect ? "Dialect updated" : "Dialect added");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("dialects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dialects"] });
      queryClient.invalidateQueries({ queryKey: ["dialects"] });
      toast.success("Dialect deleted");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dialects</CardTitle>
          <CardDescription>{dialects.length} dialects configured</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Dialect</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDialect ? "Edit Dialect" : "Add Dialect"}</DialogTitle>
              <DialogDescription>Configure dialect details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Parent Language</Label>
                <Select value={formData.language_id} onValueChange={(value) => setFormData({ ...formData, language_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id.toString()}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dialect Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Wazir" />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="South Waziristan" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ISO Code (optional)</Label>
                <Input value={formData.iso_code} onChange={(e) => setFormData({ ...formData, iso_code: e.target.value })} placeholder="ps-waz" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!formData.name}>
                {editingDialect ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>ISO Code</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dialects.map((dialect) => (
              <TableRow key={dialect.id}>
                <TableCell className="font-medium">{dialect.name}</TableCell>
                <TableCell>{dialect.languages?.name || "-"}</TableCell>
                <TableCell>{dialect.region}</TableCell>
                <TableCell>{dialect.iso_code}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(dialect)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(dialect.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Seed Words Tab Component
const SeedWordsTab = ({ seedWords, queryClient }: { seedWords: any[]; queryClient: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSeedWord, setEditingSeedWord] = useState<any>(null);
  const [formData, setFormData] = useState({
    word_english: "",
    word_urdu: "",
    category: "general",
    difficulty: "easy",
  });

  const resetForm = () => {
    setFormData({ word_english: "", word_urdu: "", category: "general", difficulty: "easy" });
    setEditingSeedWord(null);
  };

  const openEdit = (seedWord: any) => {
    setEditingSeedWord(seedWord);
    setFormData({
      word_english: seedWord.word_english,
      word_urdu: seedWord.word_urdu,
      category: seedWord.category || "general",
      difficulty: seedWord.difficulty || "easy",
    });
    setIsOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingSeedWord) {
        const { error } = await supabase.from("seed_words").update(formData).eq("id", editingSeedWord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seed_words").insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seed-words"] });
      queryClient.invalidateQueries({ queryKey: ["seed-words"] });
      toast.success(editingSeedWord ? "Seed word updated" : "Seed word added");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seed_words").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seed-words"] });
      queryClient.invalidateQueries({ queryKey: ["seed-words"] });
      toast.success("Seed word deleted");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Seed Words</CardTitle>
          <CardDescription>{seedWords.length} seed words for daily challenges</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Seed Word</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSeedWord ? "Edit Seed Word" : "Add Seed Word"}</DialogTitle>
              <DialogDescription>Add words for daily challenges</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>English Word</Label>
                  <Input value={formData.word_english} onChange={(e) => setFormData({ ...formData, word_english: e.target.value })} placeholder="Water" />
                </div>
                <div className="space-y-2">
                  <Label>Urdu Word</Label>
                  <Input value={formData.word_urdu} onChange={(e) => setFormData({ ...formData, word_urdu: e.target.value })} placeholder="پانی" dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="body">Body</SelectItem>
                      <SelectItem value="emotions">Emotions</SelectItem>
                      <SelectItem value="actions">Actions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!formData.word_english || !formData.word_urdu}>
                {editingSeedWord ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>English</TableHead>
              <TableHead>Urdu</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seedWords.map((word) => (
              <TableRow key={word.id}>
                <TableCell className="font-medium">{word.word_english}</TableCell>
                <TableCell dir="rtl">{word.word_urdu}</TableCell>
                <TableCell className="capitalize">{word.category}</TableCell>
                <TableCell className="capitalize">{word.difficulty}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(word)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(word.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Admin;
