import md from 'markdown-it';
import hljs from 'highlight.js';
import { sendEvent } from '@lib/gtag';
import Layout from '@components/Layout';
import {
  ArticleWrapper,
  ReminderWrapper,
} from '@components/Article/indexStyle';

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

mdWitHljs.renderer.rules.link_open = function (
  tokens,
  idx,
  options,
  env,
  self
) {
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    // add new attribute
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    const attrs = tokens[idx].attrs;
    if (attrs) {
      // replace value of existing attr
      attrs[aIndex][1] = '_blank';
    }
  }
  return defaultRender(tokens, idx, options, env, self);
};

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
        <ReminderWrapper>
          如果分享的內容對你有幫助，歡迎{' '}
          <a
            href="https://portaly.cc/liangc/support"
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              sendEvent({
                eventName: 'support_click',
                eventParams: {
                  article_title: pageTitle,
                  article_path: pageURL,
                },
              })
            }
          >
            點此透過小額贊助請我喝杯咖啡
          </a>{' '}
          😌 ; 如果發現部落格文章內容有誤，或有想進一步討論的內容，歡迎
          <a
            href="https://github.com/LiangYingC/Programming-Farmer-Blog/issues"
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              sendEvent({
                eventName: 'issues_click',
                eventParams: {
                  article_title: pageTitle,
                  article_path: pageURL,
                },
              })
            }
          >
            點此前往開 Issues 討論
          </a>
          ，感謝！
        </ReminderWrapper>
      </ArticleWrapper>
    </Layout>
  );
};

export default Article;
