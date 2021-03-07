import { FC } from 'react';
import fs from 'fs';
import matter from 'gray-matter';
import { GetStaticProps, GetStaticPaths } from 'next';
// import { tagPathsConfig } from '@configs/paths';

// interface HomePageProps {
//   posts: {
//     posts: {
//       slug: string;
//       frontmatter: {
//         date: any;
//       };
//     }[];
//   };
// }

const HomePage: FC = props => {
  return <div>Welcome to the Homepage!</div>;
};

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    // Only `/posts/1` and `/posts/2` are generated at build time
    paths: [{ params: { id: '1' } }, { params: { id: '2' } }],
    // Enable statically generating additional pages
    // For example: `/posts/3`
    fallback: true,
  };
};

// This also gets called at build time
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  const id = params?.id || '';
  // Pass post data to the page via props
  return {
    props: { id },
    // Re-generate the post at most once per second
    // if a request comes in
    revalidate: 1,
  };
};

// export const getStaticPaths: GetStaticPaths = async () => {
//   const tagPaths = tagPathsConfig.map(({ name }) => {
//     return {
//       params: {
//         tag: name,
//       },
//     };
//   });

//   return {
//     paths: tagPaths,
//     fallback: true,
//   };
// };

// export const getStaticProps: GetStaticProps = async ({ params }) => {
//   const tag = params.tag;
//   const files = fs.readdirSync(`${process.cwd()}/contents/posts/${tag}`);

//   const posts = files.map(fileName => {
//     const markdownWithMetadata = fs.readFileSync(`contents/posts/${tag}/${fileName}`).toString();

//     const { data } = matter(markdownWithMetadata);

//     const frontmatter = {
//       ...data,
//     };

//     return {
//       slug: fileName.replace('.md', ''),
//       frontmatter,
//     };
//   });

//   return {
//     props: {
//       posts,
//     },
//   };
// };

export default HomePage;
