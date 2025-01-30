import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'Missing Authorization header',
          code: 401,
          message: 'Authorization header is required'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the request body
    const { email, fullName, role } = await req.json()

    if (!email || !fullName || !role) {
      console.error('Missing required fields:', { email, fullName, role })
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          code: 400,
          message: 'Email, full name, and role are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Creating user:', { email, fullName, role })

    // Create the user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      password: Math.random().toString(36).slice(-8), // Generate a random password
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ 
          error: createError.message,
          code: 400,
          message: createError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update the user's role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userData.user.id,
        role: role,
      })

    if (roleError) {
      console.error('Error setting user role:', roleError)
      return new Response(
        JSON.stringify({ 
          error: roleError.message,
          code: 400,
          message: roleError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('User created successfully:', userData.user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: 'User created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 500,
        message: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})