import { emailTemplates } from '@/utils/email-templates';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    secure: true
});

const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        await transporter.sendMail({
            from: {
                name: process.env.EMAIL_FROM_NAME || "Password Vault",
                address: process.env.EMAIL_FROM_ADDRESS! || process.env.GMAIL_USER!
            },
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

export const send2faVerificationCode = async (email: string, otp: string) => {
    if (!email || !otp) throw new Error("Email and OTP are required to send a verification code.");

    const emailTemplate = emailTemplates.verification({
        userName: email.split('@')[0],
        title: "Enable Two-Factor Authentication (2FA)",
        subtitle: "Use the OTP below to complete setup",
        message: `To finish setting up two-factor authentication for your account, please enter the OTP below. This code will expire in 10 minutes. For your security, never share this code.`,
        expirationMinutes: 10,
        code: otp,
        codeLabel: "Two-Factor Authentication Code",
    });

    await sendEmail(email, "2FA Setup — Confirm with OTP", emailTemplate);
};