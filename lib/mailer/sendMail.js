const nodemailer = require('nodemailer');

async function sendMail(email, subject, text) {

    try {

        console.log(process.env.EMAIL);
        console.log(process.env.EMAIL_PASS);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: 'usof',
            to: email,
            subject,
            text
        });

        console.log(`email to ${email} send successfully`);

    } catch (err) {
        console.log('email not sent');
        console.error(err);
    }

}

module.exports = sendMail;

