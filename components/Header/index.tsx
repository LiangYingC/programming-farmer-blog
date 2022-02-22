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
  ColorModeBtn,
  ColorModeIcon,
} from '@components/Header/indexStyle';

const Header = () => {
  const { isDarkMode, toggleColorMode } = useColorMode();
  const { isHideNavBar, isShowHeaderBgColor } = useNavScrollHandler();

  const handleToggleColorMode = () => {
    if (toggleColorMode) {
      toggleColorMode();
    }
  };

  return (
    <HeaderWrapper
      isHide={isHideNavBar}
      isShowHeaderBgColor={isShowHeaderBgColor}
    >
      <InnerWrapper>
        <Title>
          <Link href={'/'}>城市碼農</Link>
        </Title>
        <Nav>
          <NavItem>
            <Link href={'/articles'}>Articles</Link>
          </NavItem>
        </Nav>
        <ColorModeBtn onClick={handleToggleColorMode}>
          <ColorModeIcon>
            {isDarkMode ? <IoMdSunny /> : <IoMdMoon />}
          </ColorModeIcon>
        </ColorModeBtn>
      </InnerWrapper>
    </HeaderWrapper>
  );
};

export default Header;
