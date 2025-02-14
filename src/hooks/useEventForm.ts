import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EventFormData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  max_participants: number;
  gallery: string[];
  category_id: string | null;
  tags: string[];
}

interface UseEventFormProps {
  initialData?: Partial<EventFormData>;
  onSuccess?: () => void;
}

export function useEventForm({ initialData, onSuccess }: UseEventFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    date: initialData?.date || "",
    time: initialData?.time || "",
    location: initialData?.location || "",
    max_participants: initialData?.max_participants || 0,
    gallery: initialData?.gallery || [],
    category_id: initialData?.category_id || null,
    tags: initialData?.tags || [],
    ...(initialData?.id ? { id: initialData.id } : {}),
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      console.log("Starting event creation process...");
      console.log("Form data being submitted:", data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("User not authenticated");
      }
      console.log("Authenticated user:", user.id);

      // Check admin role
      const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
        user_id: user.id,
        required_role: 'admin'
      });

      if (roleError) {
        console.error("Error checking admin role:", roleError);
        throw new Error("Error verifying admin permissions");
      }

      if (!hasAdminRole) {
        console.error("User does not have admin role");
        throw new Error("Insufficient permissions");
      }

      console.log("Admin role verified:", hasAdminRole);

      // Prepare event data
      const eventData = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        max_participants: data.max_participants,
        gallery: data.gallery,
        created_by: user.id,
        category_id: data.category_id,
        current_participants: 0,
        is_upcoming: true,
        tags: data.tags
      };

      console.log("Sending event data to Supabase:", eventData);

      const { data: result, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error("Database error during event creation:", error);
        throw error;
      }

      console.log("Event created successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Event creation success. Invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      if (onSuccess) {
        console.log("Calling onSuccess callback...");
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error("Event creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create event",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      if (!data.id) {
        throw new Error("Event ID is required for updates");
      }

      // Keep existing gallery images and add new ones
      const updatedEventData = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        max_participants: data.max_participants,
        gallery: data.gallery, // This now includes both existing and new images
        category_id: data.category_id,
        tags: data.tags
      };
      
      console.log("Updating event with data:", updatedEventData);
      
      const { data: result, error } = await supabase
        .from("events")
        .update(updatedEventData)
        .eq("id", data.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating event:", error);
        throw error;
      }

      console.log("Event updated successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error("Event update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update event",
      });
    },
  });

  return {
    formData,
    setFormData,
    selectedImages,
    setSelectedImages,
    createEventMutation,
    updateEventMutation,
  };
}
