// utils/sendEmail.js (server-side only)
import nodemailer from 'nodemailer';

// Function to send email using SMTP
const sendEmail = async (recipientEmail, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // TLS/SSL will be used instead
    auth: {
      // user: "a72d36001@smtp-brevo.com", // Your SMTP login
      // pass: "xsmtpsib-d08e1f8956ff9d2d737b7f85a3a506b53525735e7325d9d417aa857326e341c2-NWiga4t1PkRLDvga",         // Your SMTP password (Master Password)
       user: process.env.BREVO_USER, // Use environment variable for SMTP login
      pass: process.env.BREVO_PASS, // Use environment variable for SMTP password
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