import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────

let transactionalEmailsClient: any = null;

const isMockMode =
  env.brevo.apiKey.includes('mock') ||
  env.brevo.apiKey.includes('xxxxx') ||
  env.env === 'development';

if (!isMockMode) {
  try {
    const client = new BrevoClient({ apiKey: env.brevo.apiKey });
    transactionalEmailsClient = client.transactionalEmails;
    console.log('Brevo Email Client configured successfully in production mode.');
  } catch (error) {
    console.error('Failed to initialize Brevo Email Client:', error);
  }
} else {
  console.log('Brevo Email Client running in MOCK (local console log) mode.');
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE SENDER
// ─────────────────────────────────────────────────────────────────────────────

export const sendEmail = async (
  to:           string,
  subject:      string,
  htmlContent:  string,
  textContext?: string
): Promise<boolean> => {
  if (isMockMode || !transactionalEmailsClient) {
    console.log('\n--- [MOCK EMAIL SENT] ---');
    console.log(`To:      ${to}`);
    console.log(`From:    ${env.brevo.senderName} <${env.brevo.senderEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log('Content (HTML):');
    console.log(htmlContent);
    console.log('-------------------------\n');
    return true;
  }

  try {
    await transactionalEmailsClient.sendTransacEmail({
      subject,
      htmlContent,
      textContent: textContext,
      sender: { name: env.brevo.senderName, email: env.brevo.senderEmail },
      to: [{ email: to }],
    });
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHOP EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (
  to:   string,
  name: string
): Promise<boolean> => {
  const subject = 'Welcome to LOYYO — Sri Lanka\'s Digital Stamp Card Platform';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6C5DD3;">Welcome to LOYYO, ${name}!</h2>
      <p>Your shop registration has been received and is currently under review by our administration team.</p>
      <p>Once approved, you will receive an email letting you know you can log in, set up your loyalty cards, and start stamping!</p>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendShopApprovalEmail = async (
  to:       string,
  shopName: string
): Promise<boolean> => {
  const subject = 'Congratulations! Your Shop has been Approved on LOYYO 🎉';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4CAF50;">Your Shop is Live!</h2>
      <p>Hello,</p>
      <p>We are excited to let you know that <strong>${shopName}</strong> has been approved by the administrators.</p>
      <p>You can now log in to the Shop Dashboard, set up your stamp card thresholds, launch active offers, and mark customer visits.</p>
      <p>
        <a href="https://app.loyyo.lk/login"
           style="background-color: #6C5DD3; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Log In to Dashboard
        </a>
      </p>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendShopSuspensionEmail = async (
  to:       string,
  shopName: string,
  reason:   string
): Promise<boolean> => {
  const subject = 'Important: Your LOYYO Shop Profile has been Suspended';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #D32F2F;">
      <h2>Shop Account Suspended</h2>
      <p>Hello,</p>
      <p>We regret to inform you that your shop <strong>${shopName}</strong> has been suspended from the LOYYO platform by our administrators.</p>
      <p><strong>Reason for suspension:</strong></p>
      <blockquote style="background-color: #FFEBEE; padding: 15px; border-left: 5px solid #D32F2F; color: #333;">
        ${reason}
      </blockquote>
      <p>During this suspension, your shop profile, loyalty stamps, and active offers will not be visible to customers on the mobile app. If you believe this is an error or wish to dispute this, please contact support.</p>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Admin Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

// ─────────────────────────────────────────────────────────────────────────────
// LOYALTY EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export const sendLoyaltyRuleUpdateEmail = async (
  to:           string,
  shopName:     string,
  serviceTitle: string
): Promise<boolean> => {
  const subject = `Update regarding your loyalty progress at ${shopName}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6C5DD3;">Loyalty Card Rule Update</h2>
      <p>Hello,</p>
      <p>Please note that <strong>${shopName}</strong> has updated their loyalty rules for the service: <strong>${serviceTitle}</strong>.</p>
      <p><strong>What this means for you:</strong></p>
      <ul>
        <li>If you have already started progress on this card, you will keep your <strong>existing progress under the old rules</strong>.</li>
        <li>Once you complete your current stamp card and claim your reward, the new rule setup will apply to your next card.</li>
      </ul>
      <p>Open the LOYYO mobile app to view your digital membership card.</p>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendVisitConfirmationEmail = async (
  to:             string,
  customerName:   string,
  shopName:       string,
  currentVisits:  number,
  visitsRequired: number
): Promise<boolean> => {
  const subject         = `New stamp earned at ${shopName}! 🎯`;
  const stampsRemaining = visitsRequired - currentVisits;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6C5DD3;">New Stamp Earned!</h2>
      <p>Hi ${customerName},</p>
      <p>Thanks for visiting <strong>${shopName}</strong>. A new visit stamp has been successfully recorded on your card!</p>
      <div style="background-color: #F8F9FA; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <h1 style="margin: 0; color: #6C5DD3; font-size: 48px;">${currentVisits} / ${visitsRequired}</h1>
        <p style="color: #666; margin-top: 5px;">Stamps Collected</p>
      </div>
      <p>${stampsRemaining > 0
        ? `Just <strong>${stampsRemaining}</strong> more stamp(s) until your next reward!`
        : 'Congratulations! You have completed your stamp card! A reward has been added to your dashboard!'}
      </p>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendRewardAlertEmail = async (
  to:                string,
  customerName:      string,
  shopName:          string,
  rewardDescription: string
): Promise<boolean> => {
  const subject = `You've earned a reward at ${shopName}! 🎁`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #FF9800; text-align: center;">Congratulations, ${customerName}!</h2>
      <p>You have successfully completed a stamp card cycle at <strong>${shopName}</strong>!</p>
      <div style="background-color: #FFF9C4; border: 2px dashed #FFBC00; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; color: #E65100;">Earned Reward: ${rewardDescription}</h2>
        <p style="color: #666; margin-top: 5px; font-size: 14px;">Show your reward voucher at the shop counter to redeem.</p>
      </div>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
  to:       string,
  name:     string,
  rawToken: string
): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  const subject  = 'Reset your LOYYO password';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6C5DD3;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your LOYYO password.</p>
      <p>Click the button below to reset it. This link expires in <strong>15 minutes</strong>.</p>
      <p>
        <a href="${resetUrl}"
           style="background-color: #6C5DD3; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Reset Password
        </a>
      </p>
      <p style="color: #999; font-size: 13px; margin-top: 20px;">
        If you did not request this, you can safely ignore this email.
        Your password will not be changed.
      </p>
      <br>
      <p>Best regards,</p>
      <p><strong>The LOYYO Team</strong></p>
    </div>
  `;
  return sendEmail(to, subject, html);
};