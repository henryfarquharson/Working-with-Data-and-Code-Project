import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Clock, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  media_asset: {
    filename: string;
  };
  display: {
    name: string;
  };
}

const AdStatus = ({ userId }: { userId?: string }) => {
  const [currentAd, setCurrentAd] = useState<Booking | null>(null);
  const [nextAd, setNextAd] = useState<Booking | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      const now = new Date().toISOString();

      // Get current ad
      const { data: current } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          media_asset:media_assets(filename),
          display:displays(name)
        `)
        .eq("user_id", userId)
        .lte("start_time", now)
        .gte("end_time", now)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentAd(current as Booking | null);

      // Get next ad
      const { data: next } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          media_asset:media_assets(filename),
          display:displays(name)
        `)
        .eq("user_id", userId)
        .gt("start_time", now)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextAd(next as Booking | null);
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!currentAd) {
      setTimeRemaining("");
      return;
    }

    const updateTimeRemaining = () => {
      const endTime = new Date(currentAd.end_time);
      const now = new Date();
      
      if (now >= endTime) {
        setTimeRemaining("Ending soon");
        return;
      }

      setTimeRemaining(formatDistanceToNow(endTime, { addSuffix: true }));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentAd]);

  if (!userId) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Ad Status</CardTitle>
          <CardDescription>Sign in to view your ad schedule</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Ad Status
        </CardTitle>
        <CardDescription>What's playing now and next</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Ad */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">What's Happening Now</h3>
          {currentAd ? (
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              <p className="font-medium">{currentAd.media_asset.filename}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-3 w-3" />
                <span>{currentAd.display.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Ends {timeRemaining}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No ad currently playing</p>
          )}
        </div>

        {/* Next Ad */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Next Up</h3>
          {nextAd ? (
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              <p className="font-medium">{nextAd.media_asset.filename}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-3 w-3" />
                <span>{nextAd.display.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Starts {formatDistanceToNow(new Date(nextAd.start_time), { addSuffix: true })}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No future ads have been planned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdStatus;
