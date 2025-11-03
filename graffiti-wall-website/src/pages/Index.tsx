import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Upload, Calendar, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import graffitiLogo from "@/assets/graffiti-wall-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen flex flex-col" 
         style={{ background: 'var(--gradient-subtle)' }}>
      <header className="container mx-auto px-4 py-6 relative">
        <div className="flex flex-col items-center justify-center gap-6">
          <img 
            src={graffitiLogo} 
            alt="Graffiti Wall" 
            className="h-48"
          />
          <div className="flex gap-4">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="text-lg px-8"
            >
              Get Started
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              size="lg"
              variant="outline"
              className="text-lg px-8"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
        <div className="absolute right-4 top-6 flex gap-3">
          {isLoggedIn ? (
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
              >
                Log In
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <p className="text-xl text-muted-foreground">
                Upload, schedule, and manage your digital content with ease
              </p>
            </div>

          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="p-6 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Upload Media</h3>
              <p className="text-sm text-muted-foreground">
                Images and videos up to 80MB
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Schedule Content</h3>
              <p className="text-sm text-muted-foreground">
                Book time slots with conflict prevention
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Display Anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Kiosk mode for TV displays
              </p>
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
