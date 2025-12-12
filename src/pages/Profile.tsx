import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { Save, User } from "lucide-react";

interface Language {
  id: number;
  name: string;
  native_name: string;
}

interface Dialect {
  id: number;
  name: string;
  language_id: number;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  points: number;
  words_added: number;
  audio_uploaded: number;
  votes_cast: number;
  streak_days: number;
  default_language_id: number | null;
  default_dialect_id: number | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedDialect, setSelectedDialect] = useState<string>("");

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });

  // Fetch languages
  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Language[];
    },
  });

  // Fetch dialects filtered by language
  const { data: dialects } = useQuery({
    queryKey: ["dialects", selectedLanguage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dialects")
        .select("*")
        .eq("language_id", parseInt(selectedLanguage))
        .order("name");
      if (error) throw error;
      return data as Dialect[];
    },
    enabled: !!selectedLanguage,
  });

  // Set initial values when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.default_language_id) {
        setSelectedLanguage(profile.default_language_id.toString());
      }
      if (profile.default_dialect_id) {
        setSelectedDialect(profile.default_dialect_id.toString());
      }
    }
  }, [profile]);

  // Reset dialect when language changes
  useEffect(() => {
    if (selectedLanguage && profile?.default_language_id?.toString() !== selectedLanguage) {
      setSelectedDialect("");
    }
  }, [selectedLanguage, profile?.default_language_id]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          default_language_id: selectedLanguage ? parseInt(selectedLanguage) : null,
          default_dialect_id: selectedDialect ? parseInt(selectedDialect) : null,
        })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile?.name}</CardTitle>
                <CardDescription>{profile?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{profile?.points || 0}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{profile?.words_added || 0}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{profile?.audio_uploaded || 0}</p>
                <p className="text-xs text-muted-foreground">Audio</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{profile?.streak_days || 0}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>

            {/* Default Language/Dialect Settings */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Default Language & Dialect</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set your default language and dialect to auto-fill forms when adding words, recording audio, or completing daily challenges.
              </p>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages?.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id.toString()}>
                          {lang.name} ({lang.native_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Dialect</Label>
                  <Select 
                    value={selectedDialect} 
                    onValueChange={setSelectedDialect}
                    disabled={!selectedLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedLanguage ? "Select your dialect" : "Select language first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dialects?.map((dialect) => (
                        <SelectItem key={dialect.id} value={dialect.id.toString()}>
                          {dialect.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
