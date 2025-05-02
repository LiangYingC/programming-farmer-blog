import { Wrapper } from '@components/SupportAndIssueBlock/indexStyle';
import { sendEvent } from '@lib/gtag';
import { useTranslation } from '@hooks/useTranslation';

const SupportAndIssueBlock = () => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      {t('support.help_message')}{' '}
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
        {t('support.buy_coffee')}
      </a>{' '}
      😌 ; {t('support.issue_message')}
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
        {t('support.open_issue')}
      </a>
      {t('support.thanks')}
    </Wrapper>
  );
};

export default SupportAndIssueBlock;
