import md from 'markdown-it';
import hljs from 'highlight.js';
import Layout from '@components/Layout';
import { ArticleWrapper, GoIssueWrapper } from '@components/Article/indexStyle';

const buildMdWitHljs = md({
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
            __html: buildMdWitHljs.render(content),
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
