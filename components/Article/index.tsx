import md from 'markdown-it';
import hljs from 'highlight.js';
import Layout from '@components/Layout';
import { ArticleWrapper, GoIssueWrapper } from '@components/Article/indexStyle';

const mdWitHljs = md({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err: any) {
        throw new Error(err);
      }
    }
    return '';
  },
});

// Render Ref: https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
const defaultRender =
  mdWitHljs.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

// mdWitHljs.renderer.rules.link_open = function (
//   tokens,
//   idx,
//   options,
//   env,
//   self
// ) {
//   const aIndex = tokens[idx].attrIndex('target');
//   if (aIndex < 0) {
//     // add new attribute
//     tokens[idx].attrPush(['target', '_blank']);
//   } else {
//     const attrs = tokens[idx].attrs;
//     if (attrs) {
//       // replace value of existing attr
//       attrs[aIndex][1] = '_blank';
//     }
//   }
//   return defaultRender(tokens, idx, options, env, self);
// };

interface ArticleProps {
  content: string;
  pageTitle: string;
  pageDesc: string;
  pageURL: string;
}

const Article = ({ content, pageTitle, pageDesc, pageURL }: ArticleProps) => {
  return (
    <Layout
      pageTitle={pageTitle}
      pageDesc={pageDesc}
      pageType="article"
      pageURL={pageURL}
    >
      <ArticleWrapper>
        <article
          dangerouslySetInnerHTML={{
            __html: mdWitHljs.render(content),
          }}
        />
        <GoIssueWrapper>
          如果發現部落格文章內容有誤，或有任何想進一步討論的內容，都非常歡迎
          <a
            href="https://github.com/LiangYingC/Programming-Farmer-Blog/issues"
            target="_blank"
            rel="noreferrer"
          >
            點此前往開 Issues 討論
          </a>
          ，感謝！
        </GoIssueWrapper>
      </ArticleWrapper>
    </Layout>
  );
};

export default Article;
