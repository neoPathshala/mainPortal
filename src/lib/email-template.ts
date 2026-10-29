import { nepaliYear } from "./nepali-date";
/**
 * Standardized neoPathshala Email Template Renderer
 * Light-only, minimal layout for desktop and mobile email clients.
 */
export function generateNeoEmailHtml(options: {
  heroSub?: string;
  heroTitle: string;
  greeting: string;
  lead: string;
  otpCode?: string;
  expiryMinutes?: number | string;
  securityNote?: string;
  appName?: string;
  supportEmail?: string;
  buttonText?: string;
  buttonUrl?: string;
}): string {
  const {
    heroSub = "neoPathshala",
    heroTitle,
    greeting,
    lead,
    otpCode,
    expiryMinutes = 10,
    securityNote = "neoPathshala team members will never ask for your verification code. Never share this code with anyone.",
    appName = "neoPathshala",
    supportEmail = "contact@neopathshala.com",
    buttonText,
    buttonUrl,
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${heroTitle}</title>
  <style>
    :root { color-scheme: only light; }
    body { margin:0; padding:32px 16px; background:#f7f8f8; color:#475569; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; }
    .wrapper { width:100%; max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e8ecea; border-radius:12px; overflow:hidden; }
    .hero-banner { padding:32px 32px 0; background:#ffffff; text-align:left; }
    .hero-sub { margin-bottom:20px; color:#186B4F; font-size:14px; font-weight:700; letter-spacing:0; }
    .hero-title { margin:0; color:#17231d; font-size:24px; font-weight:600; line-height:1.35; }
    .content { padding:24px 32px 32px; background:#ffffff; }
    .greeting { margin:0 0 12px; color:#17231d; font-size:15px; font-weight:500; }
    .lead,.expiry-text { margin:0 0 20px; color:#57625c; font-size:14px; line-height:1.7; }
    .otp-row { margin:24px 0; }
    .otp-digit { display:inline-block; padding:14px 20px; border:1px solid #dbe6df; border-radius:8px; background:#f6faf7; color:#186B4F; font:600 28px/1.4 Consolas,Menlo,monospace; letter-spacing:7px; }
    .expiry-text strong { color:#17231d; font-weight:600; }
    .security-note { padding-top:20px; border-top:1px solid #edf0ee; color:#758078; font-size:12px; line-height:1.7; }
    .security-note strong { color:#57625c; font-weight:500; }
    .footer { padding:20px 32px; border-top:1px solid #edf0ee; background:#ffffff; color:#7a857e; font-size:12px; line-height:1.7; }
    .footer p { margin:0 0 4px; }
    .footer a { color:#186B4F; text-decoration:none; }
    .btn { display:inline-block; margin:4px 0 24px; padding:12px 20px; border-radius:6px; background:#186B4F; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; }
    @media (max-width:480px) { body { padding:16px 8px; } .hero-banner { padding:24px 20px 0; } .content { padding:20px; } .footer { padding:20px; } .hero-title { font-size:22px; } }
</style>
</head>
<body>
  <div class="wrapper">
    <!-- Solid #186B4F Banner with SVG Envelope Divider -->
    <div class="hero-banner">
      <div class="hero-sub">${heroSub}</div>
      <h1 class="hero-title">${heroTitle}</h1>
    </div>

    <!-- Left-Aligned Body Content -->
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p class="lead">${lead}</p>

      ${
        otpCode
          ? `<div class="otp-row">
        <span class="otp-digit">${otpCode}</span>
      </div>

      <p class="expiry-text">
        This code will expire in <strong>${expiryMinutes} minutes</strong>.
      </p>`
          : ""
      }

      ${
        buttonText && buttonUrl
          ? `<a href="${buttonUrl}" class="btn">${buttonText}</a>`
          : ""
      }

      <div class="security-note">
        <strong>Security Tip:</strong> ${securityNote}
      </div>
    </div>

    <div class="footer">
      <p>© ${nepaliYear() + " BS"} ${appName}.</p>
      <p>Questions? Contact our team at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>`;
}
