import { FC } from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Layout from '@components/Layout';
import { ArticleWrapper } from '@components/Article/indexStyle';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: FC<CodeBlockProps> = ({ language, value }) => {
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

const Article: FC<ArticleProps> = ({ content, pageTitle, pageDesc, pageURL }) => {
  return (
    <Layout pageTitle={pageTitle} pageDesc={pageDesc} pageType="article" pageURL={pageURL}>
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
      </ArticleWrapper>
    </Layout>
  );
};

export default Article;
