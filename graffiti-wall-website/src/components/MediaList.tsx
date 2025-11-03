import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Film, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface MediaAsset {
  id: string;
  type: string;
  filename: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

interface MediaListProps {
  userId: string;
}

const MediaList = ({ userId }: MediaListProps) => {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      toast.error("Failed to load media");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [userId]);

  const getMediaUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from("media")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Media deleted successfully");
      fetchMedia();
    } catch (error: any) {
      toast.error("Failed to delete media");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading media...</div>;
  }

  if (media.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No media uploaded yet. Upload your first image or video to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {media.map((item) => (
        <Card key={item.id} className="shadow-[var(--shadow-card)] overflow-hidden">
          <div className="aspect-video relative bg-muted">
            {item.type === "video" ? (
              <video 
                src={getMediaUrl(item.storage_path)} 
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <img 
                src={getMediaUrl(item.storage_path)} 
                alt={item.filename}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
              {item.type === "video" ? (
                <Film className="h-4 w-4 text-primary" />
              ) : (
                <ImageIcon className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{item.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(item.id, item.storage_path)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MediaList;
