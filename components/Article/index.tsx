import { FC } from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Layout from '@components/Layout';
import { ArticleWrapper } from '@components/Article/indexStyle';

const CodeBlock: FC<{ language: string; value: string }> = ({ language, value }) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={atomOneDark}
      customStyle={{ background: '#090c14' }}
    >
      {value}
    </SyntaxHighlighter>
  );
};

const Article: FC<{ content: string }> = ({ content }) => {
  return (
    <Layout>
      <ArticleWrapper>
        <ReactMarkdown escapeHtml={false} source={content} renderers={{ code: CodeBlock }} />
      </ArticleWrapper>
    </Layout>
  );
};

export default Article;
