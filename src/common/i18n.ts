import fs from 'fs';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';
import { Locale } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../../locales');

const languages = fs.readdirSync(localesDir).filter(file => fs.statSync(path.join(localesDir, file)).isDirectory() && Object.values(Locale).includes(file as Locale));

await i18next.use(Backend).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  supportedLngs: languages,
  ns: ['translation'],
  defaultNS: 'translation',
  backend: {
    loadPath: path.join(localesDir, '{{lng}}/{{ns}}.json')
  },
  interpolation: { escapeValue: false }
});

await i18next.loadLanguages(languages);

export const t = i18next.t.bind(i18next);
export default i18next;
