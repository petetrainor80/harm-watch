import { Resend } from "resend";

const FROM = "The Harm Watch <no-reply@harm.watch>";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendRegistrationAck(to: string, orgName: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: "We have received your access request — The Harm Watch",
    html: `
      <p>Hi,</p>
      <p>Thank you for requesting access to The Harm Watch on behalf of <strong>${escHtml(orgName)}</strong>.</p>
      <p>We will review your application and get back to you. This typically takes a few working days.</p>
      <p>The Harm Watch</p>
    `,
  });
}

export async function sendApprovalInvite(
  to: string,
  contactName: string,
  orgName: string,
  inviteLink: string
) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your access to The Harm Watch has been approved",
    html: `
      <p>Hi ${escHtml(contactName)},</p>
      <p>Your application for <strong>${escHtml(orgName)}</strong> has been approved.</p>
      <p>Click the link below to set up your account. This link expires in 24 hours.</p>
      <p><a href="${escHtml(inviteLink)}">Access The Harm Watch</a></p>
      <p>If you did not expect this email, you can ignore it.</p>
      <p>The Harm Watch</p>
    `,
  });
}

export async function sendRejectionNotice(
  to: string,
  contactName: string,
  orgName: string,
  reason: string
) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Update on your access request — The Harm Watch",
    html: `
      <p>Hi ${escHtml(contactName)},</p>
      <p>Thank you for applying for access to The Harm Watch on behalf of ${escHtml(orgName)}.</p>
      <p>After review, we are unable to approve your application at this time.</p>
      ${reason ? `<p>Reason: ${escHtml(reason)}</p>` : ""}
      <p>If you believe this is an error, please contact us.</p>
      <p>The Harm Watch</p>
    `,
  });
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
