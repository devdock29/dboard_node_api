const nodemailer = require("nodemailer");


exports.getCurrentDateTimeString = () => {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hour = date.getUTCHours().toString().padStart(2, "0");
  return `${year}-${month}-${day}_${hour}`;
};

exports.sendEmail = function (params) {
  // Create a transporter object using SMTP transport
  let transporter = nodemailer.createTransport({
    host: "mail.thundertechsol.com", // Your cPanel SMTP server address
    port: 465, // Default SMTP port for secure connections
    secure: true, // Use SSL/TLS
    auth: {
      user: process.env.EmailSender, // Your Gmail address
      pass: process.env.EmailSenderPassword, // Your Gmail password
    },
  });

  // Set up email data with attachment
  let mailOptions = {
    from: process.env.EmailSender, // Sender address
    to: params.to, // List of recipients
    subject: params.subject, // Subject line
    text: params.text, // Plain text body
  };

  // Send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
};

exports.sendEmailWithAttachment = function (params) {
  // Create a transporter object using SMTP transport
  let transporter = nodemailer.createTransport({
    host: "mail.thundertechsol.com", // Your cPanel SMTP server address
    port: 465, // Default SMTP port for secure connections
    secure: true, // Use SSL/TLS
    auth: {
      user: process.env.EmailSender, // Your Gmail address
      pass: process.env.EmailSenderPassword, // Your Gmail password
    },
  });

  // const fileName = "database_backup.sh"// Replace with how you access the file name
  const filePath = params.filePath; // Replace with how you access the file path

  // Set up email data with attachment
  let mailOptions = {
    from: process.env.EmailSender, // Sender address
    to: params.to, // List of recipients
    subject: params.subject, // Subject line
    text: params.text, // Plain text body
    attachments: [{ path: filePath }],
  };

  // Send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
};

