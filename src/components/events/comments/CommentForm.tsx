
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentFormProps {
  onSubmit: (content: string) => void;
  initialValue?: string;
  buttonText?: string;
  onCancel?: () => void;
}

export function CommentForm({ 
  onSubmit, 
  initialValue = "", 
  buttonText,
  onCancel 
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    if (!onCancel) setContent(""); // Only reset if not editing
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("Add a comment...", "கருத்தைச் சேர்க்கவும்...")}
        className="min-h-[100px]"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("Cancel", "ரத்து செய்")}
          </Button>
        )}
        <Button type="submit" disabled={!content.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {buttonText || t("Post Comment", "கருத்தை பதிவிடு")}
        </Button>
      </div>
    </form>
  );
}
