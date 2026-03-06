import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// NOTE: To use this function, you need to sign up for an email service like Resend, SendGrid, or Postmark.
// Set your API key in Supabase Secrets: 
// supabase secrets set RESEND_API_KEY=your-key

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json() // The new booking record from Webhook

        if (!RESEND_API_KEY) {
            console.log('No RESEND_API_KEY found. Mocking email send for booking:', record.id);
            return new Response(JSON.stringify({ status: 'mocked', record }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Example using Resend API
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'R&S Parrucchieri <info@rsparrucchieri.it>',
                to: [record.customer_email],
                subject: 'Conferma della tua Prenotazione - R&S Parrucchieri',
                html: `
          <div style="font-family: sans-serif; color: #1a1a1a;">
            <h1 style="color: #d4af37;">Grazie per averci scelto, ${record.customer_name}!</h1>
            <p>La tua prenotazione è stata ricevuta con successo.</p>
            <p><strong>Data:</strong> ${record.booking_date}</p>
            <p><strong>Ora:</strong> ${record.booking_time}</p>
            <br/>
            <p>Ti aspettiamo nel nostro salone. Per qualsiasi modifica, contattaci telefonicamente.</p>
            <p>Cordiali saluti,<br/>Il Team di R&S Parrucchieri</p>
          </div>
        `
            })
        })

        const data = await res.json()
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
