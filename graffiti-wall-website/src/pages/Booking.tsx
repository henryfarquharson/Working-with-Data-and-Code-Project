import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import MediaSelector from "@/components/MediaSelector";
import DisplaySelector from "@/components/DisplaySelector";
import TimePickerWheel from "@/components/TimePickerWheel";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const Booking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedDisplay, setSelectedDisplay] = useState<any>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 3600000)); // 1 hour later
  const [isChecking, setIsChecking] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingsDialog, setShowBookingsDialog] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; message: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  const checkAvailability = async () => {
    if (!selectedDisplay) {
      toast.error("Please select a display");
      return;
    }

    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsChecking(true);

    try {
      // Convert from display's local timezone to UTC
      const startTimeUTC = fromZonedTime(startTime, selectedDisplay.timezone);
      const endTimeUTC = fromZonedTime(endTime, selectedDisplay.timezone);

      const { data, error } = await supabase.rpc('check_booking_conflict', {
        p_display_id: selectedDisplay.id,
        p_start_time: startTimeUTC.toISOString(),
        p_end_time: endTimeUTC.toISOString(),
      });

      if (error) throw error;

      setAvailabilityResult({
        available: !data,
        message: data 
          ? "This time slot is already booked. Please choose another time." 
          : "Time slot is available!"
      });
      setShowAvailabilityDialog(true);
      setIsClosing(false);
      
      // Start closing animation after 1.3 seconds
      setTimeout(() => {
        setIsClosing(true);
      }, 1300);
      
      // Actually close after animation completes
      setTimeout(() => {
        setShowAvailabilityDialog(false);
        setIsClosing(false);
      }, 1500);
    } catch (error: any) {
      toast.error("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedDisplay) {
      toast.error("Please select a display first");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('display_id', selectedDisplay.id)
        .order('start_time');

      if (error) throw error;
      setBookings(data || []);
      setShowBookingsDialog(true);
    } catch (error: any) {
      toast.error("Failed to fetch bookings");
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const handleBooking = async () => {
    if (!selectedMedia || !selectedDisplay) {
      toast.error("Please select media and display");
      return;
    }

    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsBooking(true);

    try {
      // Convert from display's local timezone to UTC before storing
      const startTimeUTC = fromZonedTime(startTime, selectedDisplay.timezone);
      const endTimeUTC = fromZonedTime(endTime, selectedDisplay.timezone);

      // Check for conflicts first
      const { data: hasConflict } = await supabase.rpc('check_booking_conflict', {
        p_display_id: selectedDisplay.id,
        p_start_time: startTimeUTC.toISOString(),
        p_end_time: endTimeUTC.toISOString(),
      });

      if (hasConflict) {
        toast.error("This time slot is no longer available");
        setIsBooking(false);
        return;
      }

      // Create booking with UTC times
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          display_id: selectedDisplay.id,
          media_asset_id: selectedMedia,
          start_time: startTimeUTC.toISOString(),
          end_time: endTimeUTC.toISOString(),
        });

      if (error) throw error;

      toast.success("Booking created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Create Booking
            </CardTitle>
            <CardDescription>
              Schedule your media to display at a specific time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Select Media</h3>
              <MediaSelector userId={user?.id} onSelect={setSelectedMedia} />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Select Display</h3>
              <DisplaySelector onSelect={setSelectedDisplay} />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                Start Time {selectedDisplay && <span className="text-muted-foreground">({selectedDisplay.timezone} time)</span>}
              </h3>
              <TimePickerWheel
                value={startTime}
                onChange={setStartTime}
                label="Start"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                End Time {selectedDisplay && <span className="text-muted-foreground">({selectedDisplay.timezone} time)</span>}
              </h3>
              <TimePickerWheel
                value={endTime}
                onChange={setEndTime}
                label="End"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <p className="flex-1"><strong>{selectedDisplay?.timezone || 'UTC'} Time:</strong> {format(startTime, 'MMM d, HH:mm')} → {format(endTime, 'MMM d, HH:mm')}</p>
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                  {(() => {
                    const durationMs = endTime.getTime() - startTime.getTime();
                    const hours = Math.floor(durationMs / (1000 * 60 * 60));
                    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  })()}
                </span>
              </div>
              {selectedDisplay && (
                <p className="text-xs text-muted-foreground">
                  <strong>Converts to UTC:</strong> {formatInTimeZone(fromZonedTime(startTime, selectedDisplay.timezone), 'UTC', 'MMM d, HH:mm')} → {formatInTimeZone(fromZonedTime(endTime, selectedDisplay.timezone), 'UTC', 'MMM d, HH:mm')}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={checkAvailability}
                disabled={isChecking || !selectedDisplay}
              >
                {isChecking ? "Checking..." : "Check Availability"}
              </Button>
              
              <Dialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={fetchBookings}
                    disabled={!selectedDisplay}
                  >
                    Show Bookings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Bookings Calendar</DialogTitle>
                    <DialogDescription>
                      View all bookings for {selectedDisplay?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className={cn("p-3 pointer-events-auto border rounded-md")}
                        modifiers={{
                          booked: bookings.map(b => new Date(b.start_time))
                        }}
                        modifiersClassNames={{
                          selected: "!bg-orange-500 !text-white hover:!bg-orange-600 !rounded-md"
                        }}
                        modifiersStyles={{
                          booked: { 
                            backgroundColor: 'hsl(var(--destructive))',
                            color: 'hsl(var(--destructive-foreground))',
                            fontWeight: 'bold'
                          }
                        }}
                      />
                    </div>
                    {selectedDate && (
                      <div className="flex-1 border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 font-semibold border-b">
                          {format(selectedDate, 'd MMMM yyyy')} - Hourly Timeline
                        </div>
                        <div className="h-[400px] overflow-y-auto">
                          {Array.from({ length: 24 }, (_, i) => {
                            const hourStart = i;
                            const hourEnd = (i + 1) % 24;
                            const dayBookings = getBookingsForDate(selectedDate);
                            
                            // Check if this hour is booked
                            const booking = dayBookings.find(b => {
                              const bookingStart = new Date(b.start_time);
                              const bookingEnd = new Date(b.end_time);
                              const hourStartTime = new Date(selectedDate);
                              hourStartTime.setHours(hourStart, 0, 0, 0);
                              const hourEndTime = new Date(selectedDate);
                              hourEndTime.setHours(hourEnd, 0, 0, 0);
                              
                              return (
                                (bookingStart <= hourStartTime && bookingEnd > hourStartTime) ||
                                (bookingStart >= hourStartTime && bookingStart < hourEndTime)
                              );
                            });
                            
                            const isUserBooking = booking && booking.user_id === user?.id;
                            const isBooked = !!booking;
                            
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "px-4 py-3 border-b flex items-center justify-between",
                                  isUserBooking && "bg-green-100 dark:bg-green-900/20",
                                  isBooked && !isUserBooking && "bg-red-100 dark:bg-red-900/20",
                                  !isBooked && "bg-background"
                                )}
                              >
                                <span className="font-medium">
                                  {hourStart.toString().padStart(2, '0')}:00 - {hourEnd.toString().padStart(2, '0')}:00
                                </span>
                                <div className="flex items-center gap-2">
                                  {isUserBooking ? (
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-600 text-white">
                                      Your Booking
                                    </span>
                                  ) : isBooked ? (
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white">
                                      Booked
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-muted-foreground">
                                        Available
                                      </span>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                                        onClick={() => {
                                          const newStart = new Date(selectedDate);
                                          newStart.setHours(hourStart, 0, 0, 0);
                                          const newEnd = new Date(selectedDate);
                                          newEnd.setHours(hourEnd, 0, 0, 0);
                                          setStartTime(newStart);
                                          setEndTime(newEnd);
                                          setShowBookingsDialog(false);
                                          toast.success(`Time slot ${hourStart.toString().padStart(2, '0')}:00-${hourEnd.toString().padStart(2, '0')}:00 selected`);
                                        }}
                                      >
                                        Book
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                className="flex-1"
                onClick={handleBooking}
                disabled={isBooking || !selectedMedia || !selectedDisplay}
              >
                {isBooking ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Availability Check Dialog */}
        {showAvailabilityDialog && availabilityResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
            {/* Confetti Spray */}
            {availabilityResult.available && (
              <>
                {[...Array(20)].map((_, i) => {
                  const angle = (i / 20) * 360;
                  const distance = 150 + Math.random() * 100;
                  const x = Math.cos((angle * Math.PI) / 180) * distance;
                  const y = Math.sin((angle * Math.PI) / 180) * distance;
                  const rotate = Math.random() * 720 - 360;
                  
                  return (
                    <div
                      key={i}
                      className="absolute animate-confetti-spray"
                      style={{
                        left: '50%',
                        top: '50%',
                        '--confetti-end': `translate(${x}px, ${y}px)`,
                        '--confetti-rotate': `${rotate}deg`,
                        animationDelay: `${i * 0.02}s`,
                      } as React.CSSProperties}
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-sm",
                          i % 5 === 0 && "bg-green-500",
                          i % 5 === 1 && "bg-blue-500",
                          i % 5 === 2 && "bg-yellow-500",
                          i % 5 === 3 && "bg-purple-500",
                          i % 5 === 4 && "bg-pink-500"
                        )}
                      />
                    </div>
                  );
                })}
              </>
            )}
            
            <div className={cn(
              "bg-card border rounded-lg p-8 shadow-2xl max-w-md mx-4 relative z-10",
              availabilityResult.available ? "border-green-500" : "border-red-500",
              isClosing ? "animate-scale-out" : "animate-scale-in"
            )}>
              <div className="text-center space-y-4">
                <div className={cn(
                  "w-16 h-16 rounded-full mx-auto flex items-center justify-center",
                  availabilityResult.available ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                )}>
                  {availabilityResult.available ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className={cn(
                  "text-xl font-bold",
                  availabilityResult.available ? "text-green-600" : "text-red-600"
                )}>
                  {availabilityResult.available ? "Available!" : "Not Available"}
                </h3>
                <p className="text-muted-foreground">{availabilityResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
