import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find users whose trials expire in 1 day
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { data: expiringTrials, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, trial_ends_at')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', oneDayFromNow.toISOString())
      .lt('trial_ends_at', twoDaysFromNow.toISOString());

    if (fetchError) throw fetchError;

    console.log(`Found ${expiringTrials?.length || 0} trials expiring in 1 day`);

    // Create notifications for expiring trials
    for (const user of expiringTrials || []) {
      const daysLeft = Math.ceil(
        (new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      await supabaseAdmin.rpc('create_notification', {
        _user_id: user.id,
        _type: 'trial_expiring',
        _title: 'Trial Ending Soon',
        _message: `Your premium trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to keep your premium features!`,
        _action_url: '/settings',
        _metadata: { trial_ends_at: user.trial_ends_at }
      });

      console.log(`Notified user ${user.id} about trial expiry`);
    }

    // Find users whose trials just expired
    const now = new Date();
    const { data: expiredTrials, error: expiredError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now.toISOString());

    if (expiredError) throw expiredError;

    console.log(`Found ${expiredTrials?.length || 0} expired trials`);

    // Update expired trials to free status
    if (expiredTrials && expiredTrials.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'free' })
        .in('id', expiredTrials.map(u => u.id));

      if (updateError) throw updateError;

      // Notify users their trial has expired
      for (const user of expiredTrials) {
        await supabaseAdmin.rpc('create_notification', {
          _user_id: user.id,
          _type: 'trial_expired',
          _title: 'Trial Expired',
          _message: 'Your premium trial has ended. Upgrade now to continue using premium features!',
          _action_url: '/settings',
        });
      }

      console.log(`Updated ${expiredTrials.length} expired trials to free status`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiring: expiringTrials?.length || 0,
        expired: expiredTrials?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error checking trial expiry:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});