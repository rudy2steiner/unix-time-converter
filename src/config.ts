import {Pathnames} from 'next-intl/navigation';

export const locales = ['en', 'zh', 'ko', 'ja','pt','de'] as const;

export const languages = [
  {
    code: "en-US",
    lang: "en",
    language: "English",
  },
     {
       code: "zh-CN",
       lang: "zh",
       language: "简体中文",
     },
  {
      code: "pt",
      lang: "pt",
      language: "Português",
  },
  {
    code: "de",
    lang: "de",
    language: "Deutsch",
   }
]

export const pathnames = {
  '/': '/',
} satisfies Pathnames<typeof locales>;

// Use the default: `always`，设置为 as-needed可不显示默认路由
export const localePrefix = 'as-needed';

export type AppPathnames = keyof typeof pathnames;

export const getLanguageByLang = (lang) => {
  for (let i = 0; i < languages.length; i++) {
    if (lang == languages[i].lang) {
      return  languages[i];
    }
  }
}

export const getEditorLocale = (lang) => {
  if (lang == 'zh') {
    return 'zh-cn';
  }else if(lang==''){
    return 'en';
  }
  return lang;
}
