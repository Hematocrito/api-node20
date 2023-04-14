import { HttpException, Inject, Injectable } from '@nestjs/common';
import {
  EntityNotFoundException, QueueService, SearchRequest, StringHelper
} from 'src/kernel';
import { createTransport } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { SettingService } from 'src/modules/settings';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { render } from 'mustache';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { Model } from 'mongoose';
import { IMail } from '../interfaces';
import { EmailTemplateUpdatePayload } from '../payloads/email-template-update.payload';
import { EmailTemplateModel } from '../models/email-template.model';
import { EMAIL_TEMPLATE_PROVIDER } from '../providers';

const TEMPLATE_DIR = join(process.env.TEMPLATE_DIR, 'emails');
@Injectable()
export class MailerService {
  private mailerQueue;

  private transporter: nodemailer.Transporter;

  constructor(
    private readonly queueService: QueueService,
    private readonly settingService: SettingService,
    @Inject(EMAIL_TEMPLATE_PROVIDER)
    private readonly EmailTemplate: Model<EmailTemplateModel>
  ) {
    this.init();
    this.transporter = nodemailer.createTransport(
      smtpTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'hitceate@gmail.com',
          pass: 'kcdythrininubnyf'
        }
      })
    );
  }

  private async init() {
    this.mailerQueue = this.queueService.createInstance('MAILER_QUEUE');
    this.mailerQueue.process(
      process.env.MAILER_CONCURRENCY || 1,
      this.process.bind(this)
    );
  }

  private async getTransport() {
    const smtp = await this.settingService.getKeyValue(SETTING_KEYS.SMTP_TRANSPORTER);
    if (!smtp || !smtp.host || !smtp.auth || !smtp.port || !smtp.auth.user || !smtp.auth.pass) {
      throw new HttpException('Invalid confirguration!', 400);
    }
    smtp.port = parseInt(smtp.port, 10);
    smtp.tls = {
      rejectUnauthorized: false
    };
    return createTransport(smtp);
  }

  private async getTemplate(template = 'default', isLayout = false): Promise<string> {
    const layout = await this.EmailTemplate.findOne({
      key: isLayout ? `layouts/${template}` : template
    });
    if (layout) return layout.content;

    // eslint-disable-next-line no-param-reassign
    template = StringHelper.getFileName(template, true);

    if (template === 'blank') {
      return isLayout ? '[[BODY]]' : '';
    }

    const layoutFile = isLayout ? join(TEMPLATE_DIR, 'layouts', `${template}.html`) : join(TEMPLATE_DIR, `${template}.html`);
    if (!existsSync(layoutFile)) {
      return isLayout ? '[[BODY]]' : '';
    }

    return readFileSync(layoutFile, 'utf8');
  }

  private async process(job: any, done: Function) {
    try {
      const transport = await this.getTransport();
      const data = job.data as IMail;
      let { html } = data;
      let layout = '[[BODY]]';
      let subject = '';
      if (!html && data.template) {
        // html = await this.getTemplate(data.template);
        const template = await this.EmailTemplate.findOne({
          key: {
            $in: [
              data.template,
              `${data.template}.html`
            ]
          }
        });
        if (!template) {
          html = '';
          layout = await this.getTemplate(data.layout, true);
        } else {
          html = template.content;
          subject = template.subject;
          layout = template.layout ? await this.getTemplate(template.layout, true) : '[[BODY]]';
        }
      }
      const settings = SettingService._settingCache;
      const body = html ? render(html, {
        ...data.data,
        settings
      }) : '';
      const siteName = await this.settingService.getKeyValue(SETTING_KEYS.SITE_NAME);
      const logoUrl = await this.settingService.getKeyValue(SETTING_KEYS.LOGO_URL);
      html = render(layout, {
        siteName: siteName || process.env.SITENAME || process.env.DOMAIN,
        logoUrl,
        subject: subject || data.subject
      }).replace('[[BODY]]', body);
      const senderConfig = await this.settingService.getKeyValue(SETTING_KEYS.SENDER_EMAIL);
      const senderEmail = senderConfig || process.env.SENDER_EMAIL;
      await transport.sendMail({
        from: senderEmail,
        to: Array.isArray(data.to) ? data.to.join(',') : data.to,
        cc: Array.isArray(data.cc) ? data.cc.join(',') : data.cc,
        bcc: Array.isArray(data.cc) ? data.cc.join(',') : data.cc,
        subject: subject || data.subject,
        html
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('mail_error', e);
    } finally {
      done();
    }
  }

  public async send(email: IMail) {
    const mailSended = await this.mailerQueue.createJob(email).save();
    return mailSended;
  }

  async sendEmail(email: IMail) {
    const { source, verificationLink, siteName } = email.data;
    console.log('Link', verificationLink);
    console.log('siteName', siteName);
    const mailOptions = {
      from: 'hitceate@gmail.com',
      to: email.to,
      subject: email.subject,
      html: `<p>Hi there,</p>
      <p>Thank you for register at ${siteName}. Please click <a href="${verificationLink}" target="_blank">here</a> or copy link below to your browser to verify your email.</p>
      <p>${verificationLink}</p>`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      return error;
    }
  }

  public async verify() {
    try {
      const transport = await this.getTransport();
      const siteName = await this.settingService.getKeyValue(SETTING_KEYS.SITE_NAME) || process.env.DOMAIN;
      const senderEmail = await this.settingService.getKeyValue(SETTING_KEYS.SENDER_EMAIL) || process.env.SENDER_EMAIL;
      const adminEmail = await this.settingService.getKeyValue(SETTING_KEYS.ADMIN_EMAIL) || process.env.ADMIN_EMAIL;
      return transport.sendMail({
        from: senderEmail,
        to: adminEmail,
        subject: `Test email ${siteName}`,
        html: 'Hello, this is test email!'
      });
    } catch (e) {
      return {
        hasError: true,
        error: e
      };
    }
  }

  public async getAllTemplates(req: SearchRequest) {
    const query = { } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          subject: { $regex: regexp }
        }
      ];
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    return this.EmailTemplate.find(query).sort(sort).lean();
  }

  public async findOne(id: string) {
    return this.EmailTemplate.findById(id);
  }

  public async updateTemplate(id: string, payload: EmailTemplateUpdatePayload) {
    const template = await this.EmailTemplate.findById(id);
    if (!template) throw new EntityNotFoundException();

    template.subject = payload.subject;
    template.content = payload.content;
    template.layout = payload.layout;
    template.updatedAt = new Date();
    return template.save();
  }
}
