
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Blogs = () => {
  const { data: blogs, isLoading, error } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      console.log("Fetching blogs...");
      
      // Fetch blogs with their categories and authors
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          *,
          blog_categories (
            name
          ),
          profiles (
            full_name
          )
        `)
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching blogs:", error);
        throw error;
      }

      console.log("Fetched blogs:", data);
      
      // Transform the data to match our expected format
      return data?.map(blog => ({
        ...blog,
        author_name: blog.profiles?.full_name || "Anonymous"
      })) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load blogs. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!blogs?.length) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Blogs Found</AlertTitle>
          <AlertDescription>
            There are currently no approved blogs to display. Please check back later!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Latest Blogs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Card key={blog.id} className="flex flex-col">
            {blog.cover_image && (
              <img
                src={blog.cover_image}
                alt={blog.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}
            <CardHeader>
              <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Category: {blog.blog_categories?.name || "Uncategorized"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Author: {blog.author_name}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Blogs;
