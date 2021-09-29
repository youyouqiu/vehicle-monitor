import { getAppLang } from '../../server/getStorageData';
import storage from '../storage';
import zhCn from './zhCn';
import enUs from './enUs';

export function getLocale(key) {
  const lang = 'zh-cn';

  let localeData;

  switch (lang) {
    case 'zh-cn':
      localeData = zhCn;
      break;
    case 'en-us':
      localeData = enUs;
      break;
    default:
      localeData = zhCn;
      break;
  }

  const value = localeData[key];
  return value;
}

export function setLang(lang) {
  storage.save({
    key: '_lang_',
    data: lang,
  });
}

export async function getLang() {
  // const lang = await storage.load({ key: '_lang_' });
  const lang = await getAppLang();
  return lang;
}
