import i18n, { t } from '@i18n';
import { LocalizationMap } from 'discord.js';
import { TOptions } from 'i18next';

/* i18next-extract-disable-next-line */
export function getLocalizationMap(key: string, options?: TOptions): LocalizationMap {
  const map: LocalizationMap = {};

  for (const lang of Object.keys(i18n.store.data)) {
    /* i18next-extract-disable-next-line */
    const translation = t(key, { ...options, lng: lang });

    if (translation && translation !== key.split('.').pop()) {
      map[lang as keyof LocalizationMap] = translation;
    }
  }

  return map;
}
