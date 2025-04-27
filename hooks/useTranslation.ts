import { useRouter } from 'next/router';
import { DEFAULT_LOCALE } from '@constants/locales';
import { getTranslation } from '@lib/locale';
import { Locale } from '@myTypes/locale';

export function useTranslation() {
  const router = useRouter();
  const locale = (router.locale || DEFAULT_LOCALE) as Locale;

  const t = (key: string) => {
    return getTranslation(locale, key);
  };

  const changeLocale = (newLocale: Locale) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  return {
    t,
    locale,
    changeLocale,
  };
}
