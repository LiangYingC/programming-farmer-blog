import { FC, useEffect } from 'react';

const Homepage: FC = () => {
  const test = ['q3'];

  const testFilter = test.filter(value => value === 'q3');

  useEffect(() => {
    console.log(test);
  }, []);

  return <h1>Welcome to the Homepage!</h1>;
};

export default Homepage;
