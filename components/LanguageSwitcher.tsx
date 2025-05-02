import styled from '@emotion/styled';
import { useTranslation } from '@hooks/useTranslation';
import { LOCALE_CONFIG } from '@constants/locales';
import { Locale } from '@myTypes/locale';

const SwitcherContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 2.5px;
  margin-left: 10px;
`;

const LanguageButton = styled.button`
  background: transparent;
  color: inherit;
  border: 1px solid ${({ theme }) => theme.colors.divideLine};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  padding: 2.5px 5px;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.codeElementBg};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const LanguageSwitcher = () => {
  const { locale, changeLocale } = useTranslation();
  const targetLocale: Locale = locale === 'zh-TW' ? 'en-US' : 'zh-TW';
  const targetLocaleName = LOCALE_CONFIG[targetLocale].name;

  return (
    <SwitcherContainer>
      <LanguageButton onClick={() => changeLocale(targetLocale)}>
        {targetLocaleName}
      </LanguageButton>
    </SwitcherContainer>
  );
};

export default LanguageSwitcher;
