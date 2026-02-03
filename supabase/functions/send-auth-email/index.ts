// Supabase Auth "Send Email" Hook: send confirmation (and other auth) emails via Resend API.
// When enabled in Supabase Dashboard, Supabase will call this function instead of sending email itself.
// All auth emails (signup confirm, password reset, etc.) are sent by Resend only.

const RESEND_API_URL = "https://api.resend.com/emails";

function getHtml(confirmationUrl: string, email: string, siteUrl: string): string {
  const logoUrl = `${siteUrl.replace(/\/$/, "")}/logo.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email – GiftyZel</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <img src="${logoUrl}" alt="GiftyZel" width="48" height="48" style="display: block; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 32px 32px 24px 32px;">
                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #111111;">Confirm your email</h1>
                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #4b5563;">Hi there,</p>
                    <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.5; color: #4b5563;">
                      You signed up for GiftyZel with <strong style="color: #111111;">${escapeHtml(email)}</strong>. Click the button below to confirm your email and start sending perfect gifts.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 32px 32px 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #dc2626;">
                          <a href="${escapeHtml(confirmationUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">Confirm email</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5; word-break: break-all;">
                      <a href="${escapeHtml(confirmationUrl)}" style="color: #dc2626; text-decoration: underline;">${escapeHtml(confirmationUrl)}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 20px 0 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">GiftyZel – Send thoughtful gifts without knowing addresses.</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">If you didn't create an account, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSubject(emailActionType: string): string {
  switch (emailActionType) {
    case "signup":
      return "Confirm your GiftyZel account";
    case "recovery":
      return "Reset your GiftyZel password";
    case "email_change":
      return "Confirm your new email – GiftyZel";
    default:
      return "Confirm your email – GiftyZel";
  }
}

// Build the URL the user must open to confirm (Supabase verify endpoint then redirects to redirect_to).
function buildConfirmationUrl(
  supabaseUrl: string,
  tokenHash: string,
  type: string,
  redirectTo: string
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const verifyType = type === "signup" ? "signup" : type === "recovery" ? "recovery" : "email";
  const params = new URLSearchParams({
    token: tokenHash,
    type: verifyType,
    redirect_to: redirectTo || "",
  });
  return `${base}/auth/v1/verify?${params.toString()}`;
}

interface SendEmailHookPayload {
  user?: { email?: string };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
  const fromName = Deno.env.get("RESEND_FROM_NAME") || "GiftyZel";

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return new Response(JSON.stringify({ error: "Resend not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!supabaseUrl) {
    console.error("SUPABASE_URL is not set");
    return new Response(JSON.stringify({ error: "Supabase URL not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: SendEmailHookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = payload?.user?.email;
  const emailData = payload?.email_data;
  if (!email || !emailData?.token_hash) {
    return new Response(JSON.stringify({ error: "Missing user email or token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const redirectTo = emailData.redirect_to || "";
  const emailActionType = emailData.email_action_type || "signup";
  const siteUrl = emailData.site_url || supabaseUrl;

  const confirmationUrl = buildConfirmationUrl(
    supabaseUrl,
    emailData.token_hash,
    emailActionType,
    redirectTo
  );

  const html = getHtml(confirmationUrl, email, siteUrl);
  const subject = getSubject(emailActionType);

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend API error:", res.status, err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Hook contract: 200 with empty body on success.
  return new Response(null, { status: 200 });
});
