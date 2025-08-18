import { Resend } from "resend";

import env from "./env";

const resend = new Resend(env.RESEND_API_KEY);

export const sendVerificationEmail = async ({
  to,
  name,
  token,
  url,
}: {
  to: string;
  token: string;
  name?: string;
  url?: string;
}) => {
  const verificationUrl =
    url ?? `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "Notes <notes@gozman.dev>",
    to,
    subject: "Verify your email address",
    html: `
      <h1>Hello ${name || "there"}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
};
