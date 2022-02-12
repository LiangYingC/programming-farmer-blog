import Head from 'next/head';
import Header from '@components/Header/index';
import Footer from '@components/Footer/index';
import { Content } from '@components/Layout/indexStyle';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageDesc: string;
  pageURL: string;
  pageType: string;
}

const Layout = ({
  children,
  pageTitle,
  pageDesc,
  pageURL,
  pageType,
}: LayoutProps) => {
  const isHomePage = pageURL === 'https://www.programfarmer.com';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link
          rel="shortcut icon"
          href="https://www.programfarmer.com/assets/icons/favicon-32x32.png"
        />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} key="desc" />
        <meta property="og:type" content={pageType} key="ogType" />
        <meta property="og:title" content={pageTitle} key="ogTitle" />
        <meta property="og:description" content={pageDesc} key="ogDesc" />
        <meta property="og:url" content={pageURL} key="ogUrl" />
        <meta
          property="og:image"
          content="https://www.programfarmer.com/assets/icons/icon-384x384.png"
          key="ogImage"
        />
        <meta property="og:site_name" content="城市碼農" key="ogSiteName" />
        <meta name="twitter:title" content={pageTitle} key="twitterTitle" />
        <meta name="twitter:description" content={pageDesc} key="twitterDesc" />
        <meta name="twitter:url" content={pageURL} key="twitterPageUrl" />
        <meta
          name="twitter:image"
          content="https://www.programfarmer.com/assets/icons/icon-384x384.png"
          key="twitterImage"
        />
        <meta
          name="twitter:creator"
          content="@LiangCh95173853"
          key="twitterCreator"
        />
        {isHomePage && (
          <meta
            name="google-site-verification"
            content="_56OsPYwyzuO5DhzeVWWNACHMlX2yABiQCw7FpDZcqI"
            key="googleSearchConsole"
          />
        )}
      </Head>
      <Header />
      <Content>{children}</Content>
      <Footer />
    </>
  );
};

export default Layout;
