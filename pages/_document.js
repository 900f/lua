import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <title>Luvenn | Script Protection Platform</title>
        <meta name="description" content="Host, protect and distribute your Roblox Lua scripts" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#7c3aed" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}