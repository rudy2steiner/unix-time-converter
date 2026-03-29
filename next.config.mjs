import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    async redirects() {
        return [
            {
                source: '/:locale(en|zh|ko|ja|pt|de)/timestamp',
                destination: '/:locale',
                permanent: true,
            },
        ];
    },
    async rewrites(){
         return [
           {
              source: '/compare.html',
              destination: '/en/json-compare',
           },
           {
             source: '/freejson.html',
             destination: '/en/json-editor',
          },
          {
               source: '/index.html',
               destination: '/en/',
          },
          {
             source: '/timestamp.html',
             destination: '/en',
          },
          {
           source: '/en/json-editor',
           destination: '/en/json-formatter',
          },
         ]
        }

};

export default withNextIntl(nextConfig);
