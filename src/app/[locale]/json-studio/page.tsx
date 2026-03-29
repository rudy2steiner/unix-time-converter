import PageComponent from "./PageComponent";
import {unstable_setRequestLocale} from 'next-intl/server';
import {getIndexLanguageText,getFooterLanguageText, getJsonEditorPageLanguageText} from "~/configs/languageText";

export default async function IndexPage({params: {locale = ''}}) {
  // Enable static rendering
  unstable_setRequestLocale(locale);
  const indexLanguageText = await getIndexLanguageText();
  const footerLanguageText = await getFooterLanguageText();
  const jsonEditorText = await getJsonEditorPageLanguageText();


  return (
    <PageComponent
      locale={locale}
      indexLanguageText={indexLanguageText}
      footerLanguageText={footerLanguageText}
      jsonEditorText={jsonEditorText}
    >

    </PageComponent>
  )
}
