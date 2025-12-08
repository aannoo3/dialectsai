import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, Session } from "@supabase/supabase-js";
import { Languages, Plus, Map, Trophy, LogOut, Award, Globe, Flame, Users, Mic, Database } from "lucide-react";

const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
            <Globe className="h-6 w-6" />
            <span className="font-bold text-xl">DialectAI</span>
          </Link>

          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex text-orange-500 hover:text-orange-600">
                  <Link to="/daily-challenge">
                    <Flame className="h-4 w-4 mr-2" />
                    Daily Challenge
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link to="/add-word">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Word
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link to="/dialect-mapper">
                    <Map className="h-4 w-4 mr-2" />
                    Mapper
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link to="/leaderboard">
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link to="/tribe-competition">
                    <Users className="h-4 w-4 mr-2" />
                    Tribes
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link to="/badges">
                    <Award className="h-4 w-4 mr-2" />
                    Badges
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex text-accent hover:text-accent/80">
                  <Link to="/wazir-voice">
                    <Mic className="h-4 w-4 mr-2" />
                    Wazir AI
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex text-green-500 hover:text-green-600">
                  <Link to="/training-data">
                    <Database className="h-4 w-4 mr-2" />
                    Train AI
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/daily-challenge" className="text-orange-500">
                        <Flame className="h-4 w-4 mr-2" />
                        Daily Challenge
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/add-word">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Word
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/dialect-mapper">
                        <Map className="h-4 w-4 mr-2" />
                        Mapper
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/leaderboard">
                        <Trophy className="h-4 w-4 mr-2" />
                        Leaderboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/tribe-competition">
                        <Users className="h-4 w-4 mr-2" />
                        Tribes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/badges">
                        <Award className="h-4 w-4 mr-2" />
                        Badges
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/wazir-voice" className="text-accent">
                        <Mic className="h-4 w-4 mr-2" />
                        Wazir AI
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/training-data" className="text-green-500">
                        <Database className="h-4 w-4 mr-2" />
                        Train AI
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="md:hidden" />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link to="/dialect-mapper">
                    <Map className="h-4 w-4 mr-2" />
                    Explore
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
