import { Wrapper } from '@components/SupportAndIssueBlock/indexStyle';
import { sendEvent } from '@lib/gtag';

const SupportAndIssueBlock = () => {
  return (
    <Wrapper>
      如果分享的內容對你有幫助，歡迎{' '}
      <a
        href="https://www.buymeacoffee.com/mojito.liangc"
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          sendEvent({
            eventName: 'support_click',
            eventParams: {
              article_title: window.document.title,
              article_path: window.location.pathname,
            },
          })
        }
      >
        點此小額贊助請我喝杯咖啡
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
              article_title: window.document.title,
              article_path: window.location.pathname,
            },
          })
        }
      >
        點此前往開 Issues 討論
      </a>
      ，感謝！
    </Wrapper>
  );
};

export default SupportAndIssueBlock;
