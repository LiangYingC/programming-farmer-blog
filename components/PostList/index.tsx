import { FC } from 'react';
import Link from 'next/link';
import { formatDashDate } from '@lib/format';
import { Posts } from '@myTypes/post';
import { Article, Infos, Category, Date, Title, Brief } from '@components/PostList/indexStyle';

const PostList: FC<{ posts: Posts }> = ({ posts }) => {
  return (
    <>
      {posts.map(({ frontmatter, slug }) => {
        const { title, description, date, category } = frontmatter;
        const formattedDate = formatDashDate(date);

        return (
          <Link key={title} href={`/posts/${category}/${slug}`}>
            <Article>
              <Infos>
                <Category>{category}</Category>
                <Date>{formattedDate}</Date>
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
