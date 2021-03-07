import { FC } from 'react';
import styled from '@emotion/styled';
import { GetStaticProps } from 'next';
import { Posts } from '@myTypes/post';
import { getAllPosts } from '@lib/fs';
import { sortPostsByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import PostList from '@components/PostList';

const Intro = styled.h2`
  margin-bottom: 10px;
  padding: 0 30px;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
`;

const AllPostsPage: FC<{ posts: Posts }> = ({ posts }) => {
  return (
    <Layout>
      <Intro>Articles</Intro>
      <PostList posts={posts} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts();
  const sortedPosts = sortPostsByDateDesc(posts);
  return {
    props: {
      posts: sortedPosts,
    },
  };
};

export default AllPostsPage;
