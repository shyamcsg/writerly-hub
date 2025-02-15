
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CategoryManagement } from "./CategoryManagement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateBlogHeaderProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedLanguage: "english" | "tamil";
  onLanguageChange: (value: "english" | "tamil") => void;
  onBack: () => void;
}

export function CreateBlogHeader({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedLanguage,
  onLanguageChange,
  onBack,
}: CreateBlogHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Create New Blog
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CategoryManagement categories={categories || []} />
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">Write in English</SelectItem>
              <SelectItem value="tamil">Write in Tamil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Your content will be automatically saved as a draft while you write. You can access your drafts from the dashboard at any time.
      </p>
    </div>
  );
}
