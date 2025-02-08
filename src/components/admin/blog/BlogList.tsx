
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BlogStatusBadge } from "./BlogStatusBadge";
import { EditBlogDialog } from "./EditBlogDialog";
import { DeleteBlogDialog } from "./DeleteBlogDialog";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { useSession } from "@/hooks/useSession";

type Blog = Database["public"]["Tables"]["blogs"]["Row"];

interface BlogListProps {
  blogs: Blog[];
}

export function BlogList({ blogs }: BlogListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const { session } = useSession();

  // Add query to fetch author names
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  // Get current user's profile to check permissions
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (blogId: string) => {
      console.log("Deleting blog with ID:", blogId);
      const { error } = await supabase
        .from("blogs")
        .delete()
        .eq("id", blogId);

      if (error) {
        console.error("Error deleting blog:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Blog deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast({
        title: "Success",
        description: "Blog deleted successfully",
      });
      setBlogToDelete(null);
    },
    onError: (error: any) => {
      console.error("Delete mutation error:", error);
      
      // Handle specific error cases
      let errorMessage = "Failed to delete blog.";
      if (error?.message?.includes("row-level security")) {
        if (userProfile?.user_type === "admin" || userProfile?.user_type === "manager") {
          errorMessage = "You can only delete approved or published blogs";
        } else {
          errorMessage = "You can only delete your own blogs";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setBlogToDelete(null);
    },
  });

  // Helper function to get author name
  const getAuthorName = (authorId: string) => {
    const profile = profiles?.find(p => p.id === authorId);
    return profile?.full_name || 'Unknown Author';
  };

  const handleDelete = (blog: Blog) => {
    console.log("Setting blog to delete:", blog);
    setBlogToDelete(blog);
  };

  const canDeleteBlog = (blog: Blog) => {
    if (!session?.user?.id) return false;
    
    // Blog owner can always delete their own blog
    if (blog.author_id === session.user.id) return true;
    
    // Admins and managers can delete approved/published blogs
    if (
      (userProfile?.user_type === "admin" || userProfile?.user_type === "manager") &&
      (blog.status === "approved" || blog.status === "published")
    ) {
      return true;
    }
    
    return false;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs.map((blog) => (
            <TableRow key={blog.id}>
              <TableCell className="font-medium">{blog.title}</TableCell>
              <TableCell>{getAuthorName(blog.author_id)}</TableCell>
              <TableCell>
                <BlogStatusBadge status={blog.status} />
              </TableCell>
              <TableCell>{new Date(blog.updated_at || "").toLocaleDateString()}</TableCell>
              <TableCell className="space-x-2">
                <EditBlogDialog blog={blog} />
                {canDeleteBlog(blog) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(blog)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteBlogDialog
        open={!!blogToDelete}
        onOpenChange={(open) => {
          if (!open) setBlogToDelete(null);
        }}
        onConfirm={() => {
          if (blogToDelete) {
            console.log("Confirming delete for blog:", blogToDelete.id);
            deleteBlogMutation.mutate(blogToDelete.id);
          }
        }}
        blog={blogToDelete}
      />
    </>
  );
}
