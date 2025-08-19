import { Resend } from "resend";

import env from "./env";

const resend = new Resend(env.RESEND_API_KEY);

type SendEmail = {
  to: string;
  token: string;
  name?: string;
  url?: string;
};

export const sendVerificationEmail = async ({
  to,
  name,
  token,
  url,
}: SendEmail) => {
  const verificationUrl =
    url ?? `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: `Notes <notes@${env.RESEND_DOMAIN}>`,
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

export const sendResetPasswordEmail = async ({
  to,
  name,
  token,
  url,
}: SendEmail) => {
  const resetPasswordUrl =
    url ?? `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: `Notes <notes@${env.RESEND_DOMAIN}>`,
    to,
    subject: "Reset your password",
    html: `
      <h1>Hello ${name || "there"}!</h1>
      <p>Please reset your password by clicking the link below:</p>
      <a href="${resetPasswordUrl}">Reset Password</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
};
