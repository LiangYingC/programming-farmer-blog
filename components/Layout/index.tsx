import { FC } from 'react';
import Header from '@components/Header/index';
import Footer from '@components/Footer/index';
import { Content } from '@components/Layout/indexStyle';

const Layout: FC = ({ children }) => {
  return (
    <>
      <Header />
      <Content>{children}</Content>
      <Footer />
    </>
  );
};

export default Layout;
