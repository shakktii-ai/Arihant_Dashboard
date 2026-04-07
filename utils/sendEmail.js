// utils/sendEmail.js (server-side only)
import nodemailer from 'nodemailer';

// Function to send email using SMTP
const sendEmail = async (recipientEmail, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // TLS/SSL will be used instead
    auth: {
      user: process.env.Brevo_user, // Your SMTP login
      pass: process.env.Brevo_pass,         // Your SMTP password (Master Password)
    },
  });

  const mailOptions = {
    from: "shakktii.ai@gmail.com", // Your verified email
    to: recipientEmail,
    subject: subject,
    html: htmlContent, // HTML content of the email
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

export default sendEmail;