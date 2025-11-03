import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Film, Image as ImageIcon, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MediaAsset {
  id: string;
  type: string;
  filename: string;
  storage_path: string;
}

interface MediaSelectorProps {
  userId: string;
  onSelect: (mediaId: string | null) => void;
}

const MediaSelector = ({ userId, onSelect }: MediaSelectorProps) => {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const { data, error } = await supabase
          .from("media_assets")
          .select("id, type, filename, storage_path")
          .eq("owner_user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMedia(data || []);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchMedia();
  }, [userId]);

  const getMediaUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleSelect = (item: MediaAsset) => {
    setSelectedMedia(item);
    onSelect(item.id);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full">
        Loading media...
      </Button>
    );
  }

  if (media.length === 0) {
    return (
      <Button variant="outline" disabled className="w-full">
        No media available. Please upload first.
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedMedia ? (
            <>
              {selectedMedia.type === "video" ? (
                <Film className="h-4 w-4 mr-2" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2" />
              )}
              {selectedMedia.filename}
            </>
          ) : (
            "Select Media"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            Choose from your uploaded images and videos
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {media.map((item) => (
            <Card
              key={item.id}
              className={`relative cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                selectedMedia?.id === item.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelect(item)}
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                {item.type === "image" ? (
                  <img
                    src={getMediaUrl(item.storage_path)}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {selectedMedia?.id === item.id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{item.filename}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;
