import { Request, Response } from "express";

const resendApiUrl = "https://api.resend.com/emails";

const sendWelcomeEmail = async ({
  email,
  name,
  region,
}: {
  email: string;
  name: string;
  region: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.VOIDLAB_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      delivered: false,
      reason: "Email delivery is not configured on the backend yet.",
    };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fbff;padding:32px;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:white;border:1px solid #dbeafe;border-radius:24px;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:white">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.8">VoidLAB</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Your workspace is ready</h1>
        </div>
        <div style="padding:28px 32px">
          <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Hi ${name},</p>
          <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
            Welcome to VoidLAB. Your cloud workspace has been created for ${region}, and you can jump back in any time to code, preview, collaborate, and ship.
          </p>
          <p style="font-size:16px;line-height:1.7;margin:0 0 24px">
            Open your product link: <a href="https://void-lab-web.vercel.app/" style="color:#2563eb">https://void-lab-web.vercel.app/</a>
          </p>
          <div style="font-size:13px;color:#475569">Built for fast iteration, premium UX, and modern cloud workflows.</div>
        </div>
      </div>
    </div>
  `;

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      html,
      subject: "Welcome to VoidLAB",
      text: `Hi ${name}, your VoidLAB workspace is ready. Open https://void-lab-web.vercel.app/ to start coding.`,
      to: [email],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || "Unable to deliver welcome email.");
  }

  return {
    delivered: true,
  };
};

export const createSession = async (req: Request, res: Response) => {
  const { email, name, phone, region } = req.body ?? {};

  if (!email || !name || !phone || !region) {
    return res.status(400).json({
      error: "Missing required profile fields.",
    });
  }

  let emailStatus: { delivered: boolean; reason?: string } = {
    delivered: false,
    reason: "Email was not attempted.",
  };

  try {
    emailStatus = await sendWelcomeEmail({
      email,
      name,
      region,
    });
  } catch (error) {
    emailStatus = {
      delivered: false,
      reason: error instanceof Error ? error.message : "Welcome email failed to send.",
    };
  }

  return res.status(200).json({
    ok: true,
    mail: emailStatus,
    profile: { email, name, phone, region },
  });
};
