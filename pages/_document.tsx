import Document, { DocumentContext } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    //【 Step 1 for SC 】: 創建 ServerStyleSheet 的 instance
    const sheet = new ServerStyleSheet();
    //【 Step 2 for SC 】: 複製原始的 renderPage function. renderPage is a callback that runs the actual React rendering logic (synchronously). renderPage() returns an object like: { html, head, errorHtml, chunks, styles }
    const originalRenderPage = ctx.renderPage;

    try {
      //【 Step 3 for SC 】: 創建新的 custom renderPage，已包含 component (App) 中的樣式 props
      ctx.renderPage = () =>
        originalRenderPage({
          // Useful for wrapping the whole react tree
          enhanceApp: App => props => sheet.collectStyles(<App {...props} />),
        });

      //【 Step 4 for SC 】: Run the parent `getInitialProps`, it now includes the new custom `renderPage`
      const initialProps = await Document.getInitialProps(ctx);

      //【 Step 5 for SC 】: 將樣式提取為 <style> 標籤
      const styleTags = sheet.getStyleElement();

      //【 Step 6 for SC 】: Pass new initialProps and styleTags as a prop
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {styleTags}
          </>
        ),
      };
    } finally {
      // To avoid memory leaks, we need to manually call sheep.seal during SSR.
      sheet.seal();
    }
  }
}

export default MyDocument;

/** Reference about use style-component(SC) with Next.js :
 * 1. Official document about `Custom Document` : https://nextjs.org/docs/advanced-features/custom-document
 * 2. Official document about `Example with style-components` : https://github.com/vercel/next.js/tree/canary/examples/with-styled-components
 * 3. Next.js + Styled Components The Really Simple Guide : https://dev.to/aprietof/nextjs--styled-components-the-really-simple-guide----101c
 * */
