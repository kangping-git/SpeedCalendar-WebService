import nodeMailer from "nodemailer";

export let mailer: nodeMailer.Transporter<nodeMailer.SentMessageInfo>;

export function initMailer() {
    const type = process.env.mailType;
    const mail = process.env.mailAddress;
    const pass = process.env.mailPass;
    mailer = nodeMailer.createTransport({
        service: type,
        auth: {
            user: mail,
            pass: pass,
        },
    });
}
