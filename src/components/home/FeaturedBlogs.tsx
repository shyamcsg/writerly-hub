
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { BlogContent } from "@/components/blog-detail/BlogContent";

type Blog = Database["public"]["Tables"]["blogs"]["Row"] & {
  profiles: {
    full_name: string | null;
  } | null;
};

export function FeaturedBlogs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: blogs, isLoading, error } = useQuery({
    queryKey: ["featured-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('featured', true)
        .eq('status', 'published')
        .order('featured_month', { ascending: false });

      if (error) {
        console.error("Error fetching featured blogs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch featured blogs. Please try again later.",
        });
        throw error;
      }

      return data as Blog[];
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    console.error("Error in featured blogs component:", error);
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Failed to load featured blogs.</p>
      </div>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-50 to-red-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-red-500 to-blue-700">
            Featured Blogs
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Discover our hand-picked selection of outstanding content
          </p>
        </div>

        {isLoading ? (
          <div className="text-center">Loading featured blogs...</div>
        ) : blogs && blogs.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {blogs.map((blog) => (
                <CarouselItem key={blog.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="rounded-lg p-6 h-full transition-all duration-300 hover:scale-[1.02] bg-white/90 backdrop-blur-sm shadow-lg border border-red-100 hover:border-red-200">
                    {blog.cover_image && (
                      <img
                        src={blog.cover_image}
                        alt={blog.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-700 mt-2">
                      By {blog.profiles?.full_name || 'Anonymous'}
                    </p>
                    <div className="mt-4 text-sm text-gray-600 line-clamp-3">
                      <BlogContent content={blog.content} />
                    </div>
                    <Button
                      variant="ghost"
                      className="mt-4 w-full hover:bg-red-50 text-gray-900 hover:text-gray-800"
                      onClick={() => navigate(`/blogs/${blog.id}`)}
                    >
                      Read More
                    </Button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        ) : (
          <div className="text-center text-muted-foreground">
            No featured blogs at the moment
          </div>
        )}
      </div>
    </section>
  );
}
