import { describe, it, expect } from 'vitest';
import { I18N_STRINGS, SupportedLocale } from './i18n';

describe('Multilingual i18n Dictionaries', () => {
  const locales: SupportedLocale[] = ['en', 'te', 'hi'];

  it('supports English, Telugu, and Hindi', () => {
    expect(Object.keys(I18N_STRINGS)).toEqual(expect.arrayContaining(['en', 'te', 'hi']));
  });

  it('contains consistent translation keys across all supported languages', () => {
    const enKeys = Object.keys(I18N_STRINGS.en) as (keyof typeof I18N_STRINGS.en)[];

    for (const locale of locales) {
      const dict = I18N_STRINGS[locale];
      for (const key of enKeys) {
        expect(dict[key]).toBeDefined();
      }
    }
  });

  it('provides verified Telugu translations for Hyderabad users', () => {
    expect(I18N_STRINGS.te.location_hyderabad).toBe('బంజారా హిల్స్, హైదరాబాద్');
    expect(I18N_STRINGS.te.emergency_sos).toBe('24/7 అత్యవసర సహాయం (SOS)');
    expect(I18N_STRINGS.te.health_passport).toBe('డిజిటల్ హెల్త్ పాస్‌పోర్ట్');
    expect(I18N_STRINGS.te.categories.veterinary).toBe('పశువైద్య సేవలు');
  });

  it('provides verified Hindi translations for pan-India expansion', () => {
    expect(I18N_STRINGS.hi.book_now).toBe('अपॉइंटमेंट बुक करें');
    expect(I18N_STRINGS.hi.emergency_sos).toBe('24/7 आपातकालीन सहायता (SOS)');
    expect(I18N_STRINGS.hi.paw_rewards).toBe('पाव रिवार्ड्स बैलेंस');
    expect(I18N_STRINGS.hi.categories.grooming).toBe('ग्रूमिंग और स्पा');
  });
});
