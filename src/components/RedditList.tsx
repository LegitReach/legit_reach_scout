"use client";

import PostCard from "./PostCard";
import type { RedditPost } from "@/types";

interface Props {
  posts: RedditPost[];
  respondedPosts?: string[];
  onDone?: (id: string) => void;
}

export default function RedditList({
  posts,
  respondedPosts = [],
  onDone,
}: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDone={onDone}
        />
      ))}
    </>
  );
}
