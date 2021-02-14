import { FC } from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

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
  return <ReactMarkdown escapeHtml={false} source={content} renderers={{ code: CodeBlock }} />;
};

export default PostContent;
