
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, User, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AvatarUploadProps {
  avatarUrl?: string;
  fullName?: string;
  isEditing: boolean;
  uploading: boolean;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUpload({ avatarUrl, fullName, isEditing, uploading, onAvatarChange }: AvatarUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    
    if (!file) {
      setError("Please select a file");
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setError("Please upload an image file (jpg, jpeg, png, or gif)");
      return;
    }

    onAvatarChange(event);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32 ring-2 ring-primary/10">
        <AvatarImage 
          src={avatarUrl} 
          alt={fullName} 
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/5">
          <User className="h-12 w-12 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      {error && (
        <Alert variant="destructive" className="w-[300px]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing && (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="avatar-upload"
          />
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              document.getElementById('avatar-upload')?.click();
            }}
            disabled={uploading}
            className="w-[200px]"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Change Avatar"}
          </Button>
        </div>
      )}
    </div>
  );
}
