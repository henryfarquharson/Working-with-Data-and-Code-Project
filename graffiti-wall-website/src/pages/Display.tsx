import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Monitor } from "lucide-react";

interface Creative {
  type: string;
  url: string;
  content_type: string;
  bytes: number;
  sha256: string | null;
  duration_seconds?: number;
}

interface Slot {
  id: string;
  display_id: string;
  starts_at: string;
  ends_at: string;
  ready_at: string;
  prefetch_seconds: number;
  creative: Creative;
  playlist_version: number;
}

const Display = () => {
  const { displayId } = useParams<{ displayId: string }>();
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = async () => {
    if (!displayId) return;

    try {
      const { data, error } = await supabase.functions.invoke('playlist', {
        body: { displayId },
      });

      if (error) throw error;

      if (data?.slot) {
        setCurrentSlot(data.slot);
      } else {
        setCurrentSlot(null);
      }

      // Get display name from displayId since it's not in the new response
      if (!displayName) {
        const { data: displayData } = await supabase
          .from('displays')
          .select('name')
          .eq('id', displayId)
          .single();
        if (displayData) {
          setDisplayName(displayData.name);
        }
      }

      setError(null);
    } catch (err: any) {
      console.error("Error fetching playlist:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [displayId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <Monitor className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="text-xl">Loading display...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl text-red-400">Error: {error}</p>
          <p className="text-sm text-gray-400 mt-2">Display ID: {displayId}</p>
        </div>
      </div>
    );
  }

  if (!currentSlot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <div className="text-center text-white">
          <Monitor className="h-24 w-24 mx-auto mb-6 opacity-50" />
          <h1 className="text-4xl font-bold mb-2">{displayName || "Digital Billboard"}</h1>
          <p className="text-xl opacity-75">No content scheduled</p>
          <p className="text-sm opacity-50 mt-4">Display ID: {displayId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {currentSlot.creative.type === "video" ? (
        <video
          key={currentSlot.creative.url}
          src={currentSlot.creative.url}
          autoPlay
          loop
          muted
          className="w-full h-full object-contain"
        />
      ) : (
        <img
          key={currentSlot.creative.url}
          src={currentSlot.creative.url}
          alt={`Slot ${currentSlot.id}`}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
};

export default Display;
