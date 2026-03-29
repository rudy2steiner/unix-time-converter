import PageComponent from "./timestamp/PageComponent";
import {unstable_setRequestLocale} from 'next-intl/server';
import {getIndexLanguageText,getFooterLanguageText, getTimestampPageLanguageText} from "~/configs/languageText";

export default async function HomePage({params: {locale = ''}}) {
  unstable_setRequestLocale(locale);
  const [indexLanguageText, timestampLanguageText, footerLanguageText] = await Promise.all([
    getIndexLanguageText(),
    getTimestampPageLanguageText(),
    getFooterLanguageText(),
  ]);
  return (
    <PageComponent
      locale={locale}
      timestampLanguageText={timestampLanguageText}
      indexLanguageText={indexLanguageText}
      footerLanguageText={footerLanguageText}
    />
  );
}
