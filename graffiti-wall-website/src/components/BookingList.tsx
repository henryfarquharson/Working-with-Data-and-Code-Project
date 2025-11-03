import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  media_assets: {
    filename: string;
    type: string;
  };
  displays: {
    name: string;
  };
}

interface BookingListProps {
  userId: string;
}

const BookingList = ({ userId }: BookingListProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          media_assets (filename, type),
          displays (name)
        `)
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (error: any) {
      toast.error("Failed to cancel booking");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No bookings yet. Create your first booking to schedule content!
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const upcomingBookings = bookings.filter(booking => new Date(booking.end_time) >= now);
  const pastBookings = bookings.filter(booking => new Date(booking.end_time) < now);

  return (
    <div className="grid gap-4">
      {upcomingBookings.map((booking) => (
        <Card key={booking.id} className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">{booking.displays.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Media: {booking.media_assets.filename}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(booking.start_time)}</span>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(booking.end_time)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(booking.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {pastBookings.length > 0 && upcomingBookings.length > 0 && (
        <div className="relative my-4">
          <Separator className="bg-destructive" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-4">
            <span className="text-sm font-semibold text-destructive">Past Bookings</span>
          </div>
        </div>
      )}

      {pastBookings.length > 0 && upcomingBookings.length === 0 && (
        <div className="relative my-4">
          <Separator className="bg-destructive" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-4">
            <span className="text-sm font-semibold text-destructive">Past Bookings</span>
          </div>
        </div>
      )}

      {pastBookings.map((booking) => (
        <Card key={booking.id} className="shadow-[var(--shadow-card)] opacity-60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">{booking.displays.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Media: {booking.media_assets.filename}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(booking.start_time)}</span>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(booking.end_time)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(booking.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BookingList;
