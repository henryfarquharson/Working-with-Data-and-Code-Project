import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Support both GET (query params) and POST (body) for flexibility
    const url = new URL(req.url);
    let displayId = url.searchParams.get('displayId');
    
    if (!displayId && req.method === 'POST') {
      const body = await req.json();
      displayId = body.displayId;
    }

    // If no displayId provided, use the main billboard
    if (!displayId) {
      const { data: mainDisplay, error: mainDisplayError } = await supabase
        .from('displays')
        .select('id, name')
        .eq('is_main', true)
        .single();

      if (mainDisplayError || !mainDisplay) {
        console.error('Main billboard error:', mainDisplayError);
        return new Response(
          JSON.stringify({ error: 'No main billboard configured' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      displayId = mainDisplay.id;
    }

    // Get display info
    const { data: display, error: displayError } = await supabase
      .from('displays')
      .select('name')
      .eq('id', displayId)
      .single();

    if (displayError) {
      console.error('Display error:', displayError);
      return new Response(
        JSON.stringify({ error: 'Display not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    // Get current and next bookings with full media details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        media_assets (
          storage_path,
          type,
          filename,
          file_size,
          duration
        )
      `)
      .eq('display_id', displayId)
      .lte('start_time', now)
      .gte('end_time', now)
      .order('start_time', { ascending: true })
      .limit(1);

    if (bookingsError) {
      console.error('Bookings error:', bookingsError);
      throw bookingsError;
    }

    let slot = null;
    
    if (bookings && bookings.length > 0) {
      const booking = bookings[0];
      const mediaAsset = booking.media_assets as any;

      // Use public URL since the bucket is public (faster for Raspberry Pi)
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(mediaAsset.storage_path);

      // Determine content type from file extension
      const ext = mediaAsset.filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime'
      };

      slot = {
        id: booking.id,
        display_id: displayId,
        starts_at: booking.start_time,
        ends_at: booking.end_time,
        ready_at: new Date(new Date(booking.start_time).getTime() - 600000).toISOString(), // 10 min before
        prefetch_seconds: 600,
        creative: {
          type: mediaAsset.type,
          url: publicUrlData.publicUrl,
          content_type: contentTypeMap[ext || ''] || 'application/octet-stream',
          bytes: mediaAsset.file_size || 0,
          sha256: null, // Not stored in DB yet
          duration_seconds: mediaAsset.duration || null
        },
        playlist_version: 1 // Could be incremented on changes
      };
    }

    // Get next booking
    const { data: nextBookings, error: nextError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        media_assets (
          storage_path,
          type,
          filename,
          file_size,
          duration
        )
      `)
      .eq('display_id', displayId)
      .gt('start_time', now)
      .order('start_time', { ascending: true })
      .limit(1);

    if (nextError) {
      console.error('Next booking error:', nextError);
    }

    let next = null;
    if (nextBookings && nextBookings.length > 0) {
      const nextBooking = nextBookings[0];
      const nextMedia = nextBooking.media_assets as any;
      
      const { data: nextPublicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(nextMedia.storage_path);

      const ext = nextMedia.filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime'
      };

      next = {
        starts_at: nextBooking.start_time,
        ends_at: nextBooking.end_time,
        creative: {
          type: nextMedia.type,
          url: nextPublicUrlData.publicUrl,
          content_type: contentTypeMap[ext || ''] || 'application/octet-stream',
          bytes: nextMedia.file_size || 0,
          sha256: null
        }
      };
    }

    return new Response(
      JSON.stringify({
        slot,
        next,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in playlist function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
