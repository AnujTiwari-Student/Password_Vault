interface Feature {
  icon: string;
  title: string;
  description: string;
  bgColor?: string;
}

interface VerificationEmailParams {
  userName: string;
  title: string;
  subtitle: string;
  message: string;
  code?: string | null;
  codeLabel?: string;
  expirationMinutes?: number | null;
  actionButton?: string | null;
  actionUrl?: string | null;
  features?: Feature[];
  tips?: string[];
  isSuccess?: boolean;
}

interface EmailTemplates {
  verification: (params: VerificationEmailParams) => string;
}

export const emailTemplates: EmailTemplates = {
  verification: ({
    userName,
    title,
    subtitle,
    message,
    code = null,
    codeLabel = "Verification Code",
    expirationMinutes = null,
    actionButton = null,
    actionUrl = null,
    features = [],
    tips = [],
  }: VerificationEmailParams): string => {
    const isOTP = codeLabel.toLowerCase().includes("otp");
    const verificationType = code ? (isOTP ? "OTP" : "code") : "link";
    const expirationType = code ? (isOTP ? "OTP" : "code") : "link";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no">
  <title>${title} - Flaw</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f9fc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .verification-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .content-padding {
      padding: 40px 30px;
    }
    .primary-method {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      text-align: center;
    }
    .code-display {
      background-color: rgba(255, 255, 255, 0.2);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 3px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .code-display:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.02);
    }
    .backup-method {
      background-color: #f8fafc;
      padding: 25px;
      border-radius: 10px;
      margin-top: 20px;
      text-align: center;
    }
    .backup-button {
      display: inline-block;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 15px 30px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.3s ease;
    }
    .backup-button:hover {
      transform: translateY(-2px);
    }
    .expiration-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 6px;
      color: #92400e;
      font-size: 14px;
    }
    .method-priority {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
      color: #1f2937;
    }
    .divider {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }
    .feature-grid {
      width: 100%;
      margin: 20px 0;
    }
    .feature-item {
      width: 33.33%;
      text-align: center;
      padding: 10px;
      vertical-align: top;
    }
    .feature-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 10px;
        border-radius: 8px;
      }
      .content-padding {
        padding: 30px 20px;
      }
      .verification-header {
        padding: 30px 20px;
      }
      .code-display {
        font-size: 20px;
        letter-spacing: 2px;
      }
      .feature-item {
        width: 100%;
        display: block;
        margin-bottom: 20px;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <div class="email-container">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td class="verification-header">
                <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">${title}</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">${subtitle}</p>
              </td>
            </tr>
            <tr>
              <td class="content-padding">
                <h2 style="color: #1f2937; text-align: center; margin: 0 0 20px 0;">Hi ${userName},</h2>
                <p style="color: #4b5563; text-align: center; font-size: 16px; line-height: 1.6;">${message}</p>

                <div class="method-priority">
                  <p style="margin: 0; font-weight: 600;">
                    🚀 <strong>RECOMMENDED:</strong> Use the verification ${verificationType} below to verify your account.
                  </p>
                </div>

                ${code ? `
                  <div class="primary-method">
                    <p style="color: #ffffff; font-weight: 600; margin: 0 0 15px 0; font-size: 18px;">${codeLabel}</p>
                    <div class="code-display">${code}</div>
                    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">Tap or click to copy this ${verificationType}</p>
                  </div>
                ` : ""}

                ${expirationMinutes ? `
                  <div class="expiration-notice">
                    ⏰ This ${expirationType} will expire in 
                    <span style="font-weight: bold;">${expirationMinutes} minutes</span>.
                  </div>
                ` : ""}

                ${actionUrl && actionButton ? `
                  <div style="text-align: center; margin-top: 30px;">
                    <hr class="divider">
                    <div class="backup-method">
                      <p style="margin: 0 0 20px 0; color: #6b7280;">Or click the button below to verify:</p>
                      <a href="${actionUrl}" class="backup-button">${actionButton}</a>
                      ${expirationMinutes ? `
                        <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0;">This link will expire in ${expirationMinutes} minutes</p>
                      ` : ""}
                    </div>
                  </div>
                ` : ""}

                ${features.length > 0 ? `
                  <hr class="divider" style="margin-top: 40px;">
                  <h3 style="text-align: center; color: #1f2937; margin: 0 0 30px 0;">What Makes Flaw Special?</h3>
                  <table class="feature-grid">
                    <tr>
                      ${features.slice(0, 3).map((feature: Feature) => `
                        <td class="feature-item">
                          <div class="feature-icon" style="background-color: ${feature.bgColor || "#ddd6fe"};">
                            <span>${feature.icon}</span>
                          </div>
                          <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #1f2937;">${feature.title}</h4>
                          <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.4;">${feature.description}</p>
                        </td>
                      `).join("")}
                    </tr>
                  </table>
                ` : ""}

                ${tips.length > 0 ? `
                  <h3 style="text-align: center; margin: 40px 0 20px 0; color: #1f2937;">Quick Tips</h3>
                  <ul style="padding-left: 20px; margin: 0;">
                    ${tips.map((tip: string) => `
                      <li style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
                        ✓ ${tip}
                      </li>
                    `).join("")}
                  </ul>
                ` : ""}

                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © 2025 Flaw. All rights reserved.<br>
                    If you didn't request this verification, please ignore this email.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
};