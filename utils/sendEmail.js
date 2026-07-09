const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = async (to, name) => {
  const html =
      `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Thank You for Contacting Us</h2>

        <p>Dear ${name},</p>

        <p>
          Thank you for reaching out to us. We have successfully received
          your message and our team will review it shortly.
        </p>

        <p>
          We appreciate your interest and will get back to you as soon as possible.
        </p>

        <br>

        <p>Best Regards,</p>
        <p><strong>Bioriidl Team</strong></p>
      </div>
      `;

  await transporter.sendMail({
    from: `"Bioriidl Team" <${process.env.EMAIL_ADDRESS}>`,
    to,
    subject: "Thank You for Contacting Us",
    html,
  });
};

transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("SMTP Server Ready");
  }
});

module.exports = sendEmail;