const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendMealSummaryEmail(to, summary) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your Daily Nutrition Summary',
    text: `Here is your daily nutrition summary: Calories: ${summary.calories}, Protein: ${summary.protein}g, Carbs: ${summary.carbs}g, Fat: ${summary.fat}g.`
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendMealSummaryEmail };