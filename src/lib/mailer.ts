import { currentBranding } from './platform-mail-templates';
import { platformMail,renderPlatformTemplate,type TemplateKey } from "./platform-mail";
import nodemailer, { type Transporter } from "nodemailer";



export interface MailConfig {
  provider: "smtp" | "gmail" | "resend" | "ethereal";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  active: boolean;
  lastVerifiedAt?: string;
}


export const DEFAULT_MAIL_CONFIG: MailConfig = {
  provider: "ethereal",
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  fromName: "neoPathshala Academic Hub",
  fromEmail: "contact@neopathshala.com",
  replyTo: "contact@neopathshala.com",
  active: true,
};


export async function getMailConfig(): Promise<MailConfig> {
  // Deployment secrets take precedence over local admin snapshots.
  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  if (envHost && envUser) {
    return {
      provider: "smtp",
      host: envHost,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === "true",
      user: envUser,
      pass: process.env.SMTP_PASS || "",
      fromName: "neoPathshala Academic Hub",
      fromEmail: currentBranding(process.env.SMTP_FROM || "contact@neopathshala.com"),
      active: true,
    };
  }

  return { ...DEFAULT_MAIL_CONFIG, active: false };
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  templateKey?: TemplateKey;
  templateValues?: Record<string,string>;
}) {
  const startTime = Date.now();
  let transporter: Transporter | undefined;
  try {
    const managed = await platformMail(options.templateKey||'platform-mail');
    const routed=managed?.connection;
    const config = routed ? {provider:'smtp' as const,host:routed.host,port:routed.port,secure:routed.secure,user:routed.username,pass:routed.password,fromName:routed.fromName,fromEmail:routed.fromEmail,replyTo:routed.replyTo,active:routed.enabled} : await getMailConfig();
    const content = managed && (options.templateKey || managed.customTemplates) ? renderPlatformTemplate(managed.template,options.to,{action:options.text||options.html.replace(/<[^>]*>/g,''),supportEmail:config.replyTo||config.fromEmail||'',...options.templateValues}) : options;

    if (!config.active || config.provider === "ethereal" || (!config.user && !process.env.SMTP_USER)) {
      return { success: false, error: "Mail delivery is not configured.", isTest: false };
    }
    const isTest = false;

    if (config.provider === "gmail") {
      transporter = nodemailer.createTransport({
        service: "gmail",
        connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
        tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
        auth: { user: config.user, pass: config.pass },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.host,
        connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
        requireTLS: !config.secure,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
      });
    }

    const fromAddress = {name:managed?config.fromName:options.fromName||config.fromName,address:managed?config.fromEmail:options.fromEmail||config.fromEmail};

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: content.subject,
      html: content.html,
      text: content.text || content.html.replace(/<[^>]*>/g, ""),
      replyTo: config.replyTo,
    });

    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

    return {
      success: !!info.accepted?.length,
      messageId: info.messageId,
      previewUrl: typeof previewUrl === "string" ? previewUrl : null,
      latencyMs: Date.now() - startTime,
      isTest,
    };
  } catch (err: any) {
    return {
      success: false,
      messageId: `failed_${Date.now()}`,
      error: err.message,
      latencyMs: Date.now() - startTime,
      isTest: false,
    };
  } finally { transporter?.close(); }
}
