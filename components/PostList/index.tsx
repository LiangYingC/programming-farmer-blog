import { FC } from 'react';
import Link from 'next/link';
import { Article, Infos, Category, Date, Title, Brief } from '@components/PostList/indexStyle';

interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
}

const PostList: FC<{
  posts: {
    frontmatter: Frontmatter;
    slug: string;
  }[];
}> = ({ posts }) => {
  return (
    <>
      {posts.map(({ frontmatter, slug }) => {
        const { title, description, date, category } = frontmatter;

        return (
          <Link key={title} href={`/posts/${category}/${slug}`}>
            <Article>
              <Infos>
                <Category>{category}</Category>
                <Date>{date}</Date>
              </Infos>
              <Title>{title}</Title>
              <Brief>{description}</Brief>
            </Article>
          </Link>
        );
      })}
    </>
  );
};

export default PostList;
