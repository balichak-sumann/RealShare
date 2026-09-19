const nodemailer = require('nodemailer');

async function main() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'realshareapp@gmail.com',
      pass: 'ebmxuooclmckyari',
    },
  });

  try {
    const info = await transporter.verify();
    console.log("SMTP Server is ready to take our messages");
  } catch (error) {
    console.error("SMTP Error:");
    console.error(error);
  }
}

main();
