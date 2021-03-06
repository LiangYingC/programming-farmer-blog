import { FC } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import Link from 'next/link';
import { useColorMode } from '@contexts/ColorModeContext';
import { Wrapper, Title, Nav, NavItem, ColorModeIcon } from '@components/Header/indexStyle';

const Header: FC = () => {
  const { isDark, toggleColorMode } = useColorMode();

  const handleToggleColorMode = () => {
    if (toggleColorMode) {
      toggleColorMode();
    }
  };

  return (
    <Wrapper>
      <Title>
        <Link href={'/'}>城市碼農</Link>
      </Title>
      <Nav>
        <NavItem>
          <Link href={'/posts'}>Articles</Link>
        </NavItem>
        <NavItem onClick={handleToggleColorMode}>
          {isDark ? (
            <ColorModeIcon>
              <FiSun />
            </ColorModeIcon>
          ) : (
            <ColorModeIcon>
              <FiMoon />
            </ColorModeIcon>
          )}
        </NavItem>
      </Nav>
    </Wrapper>
  );
};

export default Header;
