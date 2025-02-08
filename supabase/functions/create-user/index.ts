
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserPayload {
  email: string
  fullName: string
  role: 'reader' | 'writer' | 'manager' | 'admin'
  password: string
  level: string
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidRole(role: string): role is CreateUserPayload['role'] {
  return ['reader', 'writer', 'manager', 'admin'].includes(role);
}

function validatePayload(payload: any): { isValid: boolean; error?: string } {
  if (!payload) {
    return { isValid: false, error: 'Payload is required' };
  }

  if (!payload.email || !isValidEmail(payload.email)) {
    return { isValid: false, error: 'Valid email is required' };
  }

  if (!payload.fullName || payload.fullName.trim().length < 2) {
    return { isValid: false, error: 'Full name is required (minimum 2 characters)' };
  }

  if (!payload.role || !isValidRole(payload.role)) {
    return { isValid: false, error: 'Valid role is required (reader, writer, manager, or admin)' };
  }

  if (!payload.password || payload.password.length < 6) {
    return { isValid: false, error: 'Password is required (minimum 6 characters)' };
  }

  if (!payload.level) {
    return { isValid: false, error: 'Level is required' };
  }

  return { isValid: true };
}

function createErrorResponse(status: number, message: string, details?: any): Response {
  console.error(`Error: ${message}`, details);
  return new Response(
    JSON.stringify({
      error: message,
      details
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables');
      return createErrorResponse(500, 'Server configuration error');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const payload: CreateUserPayload = await req.json();
    console.log('Received payload:', payload);
    
    const validation = validatePayload(payload);
    if (!validation.isValid) {
      return createErrorResponse(400, validation.error!);
    }

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error checking existing users:', listError);
      return createErrorResponse(500, 'Failed to check existing users');
    }

    const userExists = existingUsers.users.some(user => user.email === payload.email);
    if (userExists) {
      return createErrorResponse(400, 'User with this email already exists');
    }

    console.log("Creating auth user for email:", payload.email);

    // First create the auth user
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName,
        role: payload.role,
        level: payload.level
      },
    });

    if (createUserError) {
      console.error('Error creating auth user:', createUserError);
      return createErrorResponse(500, `Failed to create auth user: ${createUserError.message}`);
    }

    if (!authUser.user) {
      console.error('No user returned from auth user creation');
      return createErrorResponse(500, 'Failed to create auth user: No user returned');
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Wait a moment for the auth trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authUser.user.id,
        role: payload.role,
        created_at: new Date().toISOString()
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      return createErrorResponse(500, `Failed to create user role: ${roleError.message}`);
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        level: payload.level,
        user_type: payload.role,
        full_name: payload.fullName
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return createErrorResponse(500, `Failed to update profile: ${profileError.message}`);
    }

    // Non-critical: Send welcome notification
    try {
      const notificationType = payload.role === 'writer' ? 'writer_welcome' : 'reader_welcome';
      const { error: notificationError } = await supabaseAdmin.functions.invoke('signup-notifications', {
        body: {
          type: notificationType,
          email: payload.email,
          fullName: payload.fullName,
        }
      });

      if (notificationError) {
        console.error('Error sending welcome notification:', notificationError);
      } else {
        console.log('Welcome notification sent successfully');
      }
    } catch (notificationError) {
      console.error('Error invoking signup-notifications function:', notificationError);
    }

    return createSuccessResponse({
      user: authUser.user,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error("Error in create-user function:", error);
    return createErrorResponse(500, 'An unexpected error occurred', error);
  }
});
