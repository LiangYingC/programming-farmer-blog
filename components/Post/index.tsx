import { FC } from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Layout from '@components/Layout';
import { Article } from '@components/Post/indexStyle';

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

const PostContent: FC<{ content: string }> = ({ content }) => {
  return (
    <Layout>
      <Article>
        <ReactMarkdown escapeHtml={false} source={content} renderers={{ code: CodeBlock }} />
      </Article>
    </Layout>
  );
};

export default PostContent;
