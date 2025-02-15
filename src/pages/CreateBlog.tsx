
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogContentSection } from "@/components/admin/blog/BlogContentSection";
import { CreateBlogHeader } from "@/components/admin/blog/CreateBlogHeader";
import { CreateBlogActions } from "@/components/admin/blog/CreateBlogActions";
import { useBlogForm } from "@/hooks/useBlogForm";

export default function CreateBlog() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const {
    selectedLanguage,
    setSelectedLanguage,
    title,
    content,
    titleTamil,
    contentTamil,
    selectedCategory,
    setSelectedCategory,
    handleSubmit,
    handleTranslate,
    handleBack,
    setTitle,
    setContent,
    setTitleTamil,
    setContentTamil,
    hasContent,
    isSubmitting,
  } = useBlogForm();

  return (
    <div className="container max-w-[1400px] py-8">
      <div className="space-y-6">
        <CreateBlogHeader
          categories={categories || []}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onBack={handleBack}
        />
        
        <CreateBlogActions
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />

        <BlogContentSection
          language={selectedLanguage}
          title={selectedLanguage === "english" ? title : titleTamil}
          content={selectedLanguage === "english" ? content : contentTamil}
          onTitleChange={selectedLanguage === "english" ? setTitle : setTitleTamil}
          onContentChange={selectedLanguage === "english" ? setContent : setContentTamil}
          onTranslate={selectedLanguage === "english" ? handleTranslate : undefined}
          hasContent={hasContent()}
        />
      </div>
    </div>
  );
}
