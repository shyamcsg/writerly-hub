
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserWithRole } from "@/types/user-management";
import { useEffect } from "react";

export function useUserQueries() {
  const queryClient = useQueryClient();

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to changes in profiles table
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Invalidate and refetch when any change occurs
          queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
        }
      )
      .subscribe();

    // Subscribe to changes in user_roles table
    const rolesChannel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          // Invalidate and refetch when any change occurs
          queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Then, get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('Fetched profiles:', profiles);
      console.log('Fetched user roles:', userRoles);

      // Map each profile to include its role
      const usersWithRoles = profiles.map(profile => {
        // Find the role for this profile (if it exists)
        const userRole = userRoles.find(role => role.user_id === profile.id);
        
        // Return the profile with its role, defaulting to "reader" if no role is found
        return {
          ...profile,
          role: userRole?.role || "reader"
        };
      });

      console.log('Number of profiles:', profiles.length);
      console.log('Number of roles:', userRoles.length);
      console.log('Number of combined users:', usersWithRoles.length);
      console.log('Combined users with roles:', usersWithRoles);
      
      return usersWithRoles as UserWithRole[];
    },
  });
}
