import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BlogContentSectionProps {
  language: "english" | "tamil";
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onTranslate?: () => void;
  hasContent?: boolean;
}

export function BlogContentSection({
  language,
  title,
  content,
  onTitleChange,
  onContentChange,
  onTranslate,
  hasContent,
}: BlogContentSectionProps) {
  const isEnglish = language === "english";

  return (
    <Card className="h-[800px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {isEnglish ? (
              <>
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle>English Content</CardTitle>
                    <CardDescription>Write your blog post in English</CardDescription>
                  </div>
                  {onTranslate && (
                    <Button
                      onClick={onTranslate}
                      disabled={!hasContent}
                      className="bg-[#FF4747] hover:bg-[#FF4747]/90 text-white px-8"
                    >
                      Translate
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <CardTitle>Tamil Content</CardTitle>
                <CardDescription>தமிழில் உங்கள் வலைப்பதிவை எழுதுங்கள்</CardDescription>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
        <div>
          <label htmlFor={`title-${language}`} className="text-sm font-medium">
            Title
          </label>
          <Input
            id={`title-${language}`}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={isEnglish ? "Enter blog title" : "தலைப்பை உள்ளிடவும்"}
          />
        </div>
        <div className="flex-1 min-h-0">
          <label htmlFor={`content-${language}`} className="text-sm font-medium block mb-2">
            Content
          </label>
          <div className="h-[600px]">
            <RichTextEditor
              content={content}
              onChange={onContentChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}