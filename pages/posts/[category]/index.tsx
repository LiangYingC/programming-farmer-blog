import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Text } from '@chakra-ui/react';
import { categoryPaths } from '@configs/paths';
import { getPostFilesByCategory, getPostMatter, getPostSlug } from '@lib/fs';

interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
}

interface CategoryPageProps {
  category: string;
  posts: {
    frontmatter: Frontmatter;
    slug: string;
  }[];
}

const CategoryPage: FC<CategoryPageProps> = ({ category, posts }) => {
  console.log({ category, posts });
  return (
    <div>
      {posts.map(({ frontmatter, slug }) => {
        const { title, description, date, category } = frontmatter;

        return (
          <Link key={title} href={`/posts/${category}/${slug}`}>
            {title}
          </Link>
        );
      })}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = (params?.category || '') as string;

  const postFiles = getPostFilesByCategory(category);

  const posts = postFiles.map(postFile => {
    // post frontmatter data
    const postFilePath = `${process.cwd()}/contents/posts/${category}/${postFile}`;
    const { frontmatter } = getPostMatter(postFilePath);

    // post slug data
    const postSlug = getPostSlug(postFile);

    return {
      frontmatter,
      slug: postSlug,
    };
  });

  return {
    props: {
      category,
      posts,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = categoryPaths.map(({ name }) => {
    return {
      params: {
        category: name,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export default CategoryPage;
