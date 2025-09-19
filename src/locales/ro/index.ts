import en from '../en/index.js';
import type { Translation } from '../i18n-types.js';

const ro = {
  ...en, // allows for incomplete translations, aka fallback to default (en) locale
  HI: 'Salut lume!',
  test: 'Acesta este un test'
} satisfies Translation;

export default ro;
