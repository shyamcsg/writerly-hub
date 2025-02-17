
import { Link } from "react-router-dom";
import { BookPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogTable } from "@/components/dashboard/BlogTable";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/hooks/use-toast";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: blogs, isLoading, isFetching } = useDashboardData(session?.user?.id);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blogs',
          filter: `author_id=eq.${session.user.id}`
        },
        () => {
          console.log('Blog change detected, invalidating query');
          queryClient.invalidateQueries({
            queryKey: ["writer-blogs", session.user.id]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);

  const handleDelete = async (blogId: string) => {
    try {
      const { error } = await supabase
        .from("blogs")
        .delete()
        .eq("id", blogId);

      if (error) throw error;

      // Manually remove the deleted blog from the cache
      queryClient.setQueryData(
        ["writer-blogs", session?.user?.id],
        (oldData: any) => oldData?.filter((blog: any) => blog.id !== blogId)
      );

      toast({
        title: "Success",
        description: "Blog deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handlePublish = async (blogId: string) => {
    try {
      console.log("Publishing blog:", blogId);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("blogs")
        .update({ 
          status: 'published',
          published_at: now
        })
        .eq("id", blogId)
        .select();

      if (error) {
        console.error("Error publishing blog:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Blog published successfully",
      });
    } catch (error: any) {
      console.error("Publish error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const paginatedBlogs = blogs?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Writer's Dashboard</h1>
          <Link to="/write">
            <Button>
              <BookPlus className="mr-2 h-4 w-4" />
              Write New Blog
            </Button>
          </Link>
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <BlogTable 
            blogs={paginatedBlogs || []} 
            onDelete={handleDelete}
            onPublish={handlePublish}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={blogs?.length || 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
