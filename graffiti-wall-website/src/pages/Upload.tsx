import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload as UploadIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'video/mp4'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PNG, JPG, and MP4 files are allowed");
      return;
    }

    // Validate file size
    const maxSize = selectedFile.type.startsWith('video/') ? 80 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const maxSizeMB = selectedFile.type.startsWith('video/') ? 80 : 5;
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    setFile(selectedFile);

    // Create preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };
  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const storagePath = fileName;
      const {
        error: uploadError
      } = await supabase.storage.from('media').upload(storagePath, file);
      if (uploadError) throw uploadError;
      setUploadProgress(70);

      // Get file dimensions for images
      let width: number | null = null;
      let height: number | null = null;
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = preview!;
        await new Promise(resolve => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            resolve(null);
          };
        });
      }

      // Create database record
      const {
        error: dbError
      } = await supabase.from('media_assets').insert({
        owner_user_id: user.id,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        storage_path: storagePath,
        filename: file.name,
        file_size: file.size,
        width,
        height
      });
      if (dbError) throw dbError;
      setUploadProgress(100);
      toast.success("Media uploaded successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };
  return <div className="min-h-screen" style={{
    background: 'var(--gradient-subtle)'
  }}>
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload Media
            </CardTitle>
            <CardDescription>
              Upload images (PNG, JPG - max 5MB) or videos (MP4 - max 80MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <div className="relative">
                <Input id="file" type="file" accept=".png,.jpg,.jpeg,.mp4" onChange={handleFileChange} disabled={isUploading} lang="en" className="px-4 file:mr-6 file:px-6 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer py-[30px] text-center" />
              </div>
            </div>

            {preview && <div className="rounded-lg overflow-hidden border">
                <img src={preview} alt="Preview" className="w-full h-auto" />
              </div>}

            {file && <div className="space-y-2 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Type: {file.type.startsWith('video/') ? 'Video' : 'Image'}
                </p>
              </div>}

            {isUploading && <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>}

            <Button className="w-full" onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? "Uploading..." : "Upload Media"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>;
};
export default Upload;