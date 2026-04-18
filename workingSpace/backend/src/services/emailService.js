const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

class EmailService {
  static async sendEmail(to, subject, text, html = null) {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return { success: false, message: 'Email service not configured' };
    }


    const msg = {
      to,
      from: process.env.FROM_EMAIL || 'noreply@wavealert.com',
      subject,
      text,
      html: html || text
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  static async sendBulkEmail(recipients, subject, text, html = null) {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Emails not sent.');
      return { success: false, message: 'Email service not configured' };
    }

    const messages = recipients.map(to => ({
      to,
      from: process.env.FROM_EMAIL || 'noreply@wavealert.com',
      subject,
      text,
      html: html || text
    }));

    try {
      await sgMail.send(messages);
      console.log(`Bulk email sent successfully to ${recipients.length} recipients`);
      return { success: true, count: recipients.length };
    } catch (error) {
      console.error('Bulk email sending failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = EmailService;
