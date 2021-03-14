import { FC } from 'react';
import { IoMdSunny, IoMdMoon } from 'react-icons/io';
import Link from 'next/link';
import useNavScrollHandler from '@hooks/useNavScrollHandler';
import { useColorMode } from '@contexts/ColorModeContext';
import {
  HeaderWrapper,
  InnerWrapper,
  Title,
  Nav,
  NavItem,
  ColorModeIcon,
} from '@components/Header/indexStyle';

const Header: FC = () => {
  const { isDark, toggleColorMode } = useColorMode();
  const { isHideNavBar, isShowHeaderBgColor } = useNavScrollHandler();

  const handleToggleColorMode = () => {
    if (toggleColorMode) {
      toggleColorMode();
    }
  };

  return (
    <HeaderWrapper isHide={isHideNavBar} isShowHeaderBgColor={isShowHeaderBgColor}>
      <InnerWrapper>
        <Title>
          <Link href={'/'}>城市碼農</Link>
        </Title>
        <Nav>
          <NavItem>
            <Link href={'/articles'}>Articles</Link>
          </NavItem>
          <NavItem onClick={handleToggleColorMode}>
            <ColorModeIcon>{isDark ? <IoMdSunny /> : <IoMdMoon />}</ColorModeIcon>
          </NavItem>
        </Nav>
      </InnerWrapper>
    </HeaderWrapper>
  );
};

export default Header;
