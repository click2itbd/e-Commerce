import nodemailer from 'nodemailer';
export class SmtpEmailProvider {
    config;
    transporter = null;
    requestTimeout;
    constructor(config, requestTimeout = 10000) {
        this.config = config;
        this.requestTimeout = requestTimeout;
    }
    getTransporter() {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: {
                    user: this.config.user,
                    pass: this.config.password,
                },
                connectionTimeout: this.requestTimeout,
                greetingTimeout: this.requestTimeout,
                socketTimeout: this.requestTimeout,
            });
        }
        return this.transporter;
    }
    async sendEmail(to, subject, html, attachments) {
        if (!this.config.host || !this.config.user || !this.config.password) {
            const error = 'SMTP configuration is incomplete';
            console.warn(`${error}: host=${this.config.host}, user=${this.config.user}`);
            return { success: false, error, code: 'SMTP_CONFIG_MISSING' };
        }
        try {
            const transporter = this.getTransporter();
            const mailOptions = {
                from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
                to,
                subject,
                html,
                attachments,
            };
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        }
        catch (error) {
            console.error('SMTP Email Error details:', {
                code: error.code,
                message: error.message,
                response: error.response,
                responseCode: error.responseCode,
                command: error.command
            });
            return {
                success: false,
                error: error.message || 'Unknown SMTP error',
                code: error.code || 'SMTP_SEND_ERROR'
            };
        }
    }
    async verifyConnection() {
        try {
            const transporter = this.getTransporter();
            await transporter.verify();
            return {
                success: true,
                code: 'SMTP_OK',
                message: 'SMTP connection verified successfully',
            };
        }
        catch (error) {
            const code = this.classifyError(error);
            const message = error?.message || 'SMTP connection verification failed';
            return {
                success: false,
                code,
                message,
            };
        }
    }
    classifyError(error) {
        const message = error?.message || '';
        if (message.includes('Invalid login') || message.includes('Authentication') || message.includes('535')) {
            return 'SMTP_AUTH_FAILED';
        }
        if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
            return 'SMTP_CONNECTION_REFUSED';
        }
        if (message.includes('ETIMEDOUT') || message.includes('timeout') || message.includes('ESOCKETTIMEDOUT')) {
            return 'SMTP_TIMEOUT';
        }
        if (message.includes('self-signed certificate') || message.includes('CERT_HAS_EXPIRED') || message.includes('unable to verify')) {
            return 'SMTP_TLS_ERROR';
        }
        if (message.includes('550') || message.includes('5.1.1')) {
            return 'SMTP_RECIPIENT_REJECTED';
        }
        return 'SMTP_UNKNOWN_ERROR';
    }
}
