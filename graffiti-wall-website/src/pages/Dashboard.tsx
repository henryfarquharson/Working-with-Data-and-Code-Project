import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Calendar, LogOut, Film, Image as ImageIcon, ArrowLeft } from "lucide-react";
import MediaList from "@/components/MediaList";
import BookingList from "@/components/BookingList";
import AdStatus from "@/components/AdStatus";
import graffitiLogo from "@/assets/graffiti-wall-logo.png";
import orangeSplatter from "@/assets/orange-splatter.png";
import blueSplatter from "@/assets/blue-splatter.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        setProfile(profileData);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <img 
                src={graffitiLogo} 
                alt="Graffiti Wall" 
                className="h-20"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {profile?.name || user?.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 mb-8 md:grid-cols-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Upload media or create a booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate("/upload")}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/booking")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </CardContent>
          </Card>

          <AdStatus userId={user?.id} />
        </div>

        <Tabs defaultValue="media" className="w-full">
          <TabsList>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4 mr-2" />
              My Media
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="media" className="mt-6">
            <MediaList userId={user?.id} />
          </TabsContent>
          <TabsContent value="bookings" className="mt-6">
            <BookingList userId={user?.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
