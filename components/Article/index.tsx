import ReactMarkdown from 'react-markdown/with-html';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Layout from '@components/Layout';
import { ArticleWrapper, GoIssueWrapper } from '@components/Article/indexStyle';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock = ({ language, value }: CodeBlockProps) => {
  return (
    <SyntaxHighlighter language={language} style={atomOneDark}>
      {value}
    </SyntaxHighlighter>
  );
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
        <ReactMarkdown
          escapeHtml={false}
          source={content}
          renderers={{
            code: CodeBlock,
            link: function customAnchorElement({ href, children }) {
              // ref : https://github.com/remarkjs/react-markdown/issues/12
              return (
                <a href={href} target="_blank" rel="noreferrer noopener">
                  {children}
                </a>
              );
            },
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
