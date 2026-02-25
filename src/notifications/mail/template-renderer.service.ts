import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as HandleBars from 'hbs';

@Injectable()
export class TemplateRendererService {
  constructor(private readonly configService: ConfigService) {}

  render(template: string, context: Record<string, unknown>): string {
    const viewDir = path.join(process.cwd(), 'templates', template);
    const templateContent = fs.readFileSync(viewDir, { encoding: 'utf-8' });
    const templateSpec = HandleBars.handlebars.compile(templateContent);

    return templateSpec({
      ...context,
      app_name: this.configService.get<string>('APP_NAME') || 'Hotelslit',
      email_addressee: this.configService.get<string>('EMAIL_SENDER') || 'hotelslit@gmail.com',
      current_year: new Date().getFullYear(),
    });
  }
}
