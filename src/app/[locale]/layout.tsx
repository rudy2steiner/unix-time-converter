import clsx from 'clsx';
import {Inter} from 'next/font/google';
import {notFound} from 'next/navigation';
import {getTranslations, unstable_setRequestLocale} from 'next-intl/server';
import {ReactNode} from 'react';
import {locales} from '~/config';
import { CommonProvider } from '~/context/common-context';
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({subsets: ['latin']});

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
                                             children,
                                             params: {locale}
                                           }: Props) {

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Enable static rendering
  unstable_setRequestLocale(locale);


  return (
    <html className="h-full" lang={locale}>
    <head>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-EGYP4W50N7" ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-EGYP4W50N7');
                  `,
        }}
      />
    <script defer data-domain="jsonhome.com" src="https://app.pageview.app/js/script.js"></script>
    </head>
    <body suppressHydrationWarning={true} className={clsx(inter.className, 'flex h-100vh flex-col bg-[#FAFAF9]')}>
    <CommonProvider>
      {children}
    </CommonProvider>
    <Analytics />
    </body>
    </html>
  );
}
