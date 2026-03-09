"use client";

import PostCard from "./PostCard";
import type { RedditPost } from "@/types";

interface Props {
  posts: RedditPost[];
  savedPosts?: string[];
  respondedPosts?: string[];
  onSave?: (id: string) => void;
  onDone?: (id: string) => void;
}

export default function RedditList({
  posts,
  savedPosts = [],
  respondedPosts = [],
  onSave,
  onDone,
}: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          saved={savedPosts.includes(post.id)}
          onSave={onSave}
          onDone={onDone}
        />
      ))}
    </>
  );
}
