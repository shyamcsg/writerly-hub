
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

type Blog = Database["public"]["Tables"]["blogs"]["Row"];

interface BlogListProps {
  blogs: Blog[];
}

export function BlogList({ blogs }: BlogListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

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
    onError: (error) => {
      console.error("Delete mutation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete blog. Make sure you have the required permissions.",
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(blog)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
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
      />
    </>
  );
}
