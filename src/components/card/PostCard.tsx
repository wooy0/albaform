"use client";

import { useState } from "react";
import { formatDate } from "../../utils/formatDate";
import CommentAndLikeCount from "../CommentAndLikeCount";
import UserInfoInCard from "../UserInfoInCard";
import { PostCardProps } from "@/types/post";
import Link from "next/link";
import PostCardThumbnail from "../PostCardThumbnail";

const PostCard = ({ info }: { info: PostCardProps }) => {
  const [isHover, setIsHover] = useState(false);
  const [_, formattedCreatedDate] = formatDate("", info.createdAt);

  return (
    <Link href={`albatalks/${info.id}`}>
      <section
        className="relative flex h-[210px] w-[327px] flex-col justify-between rounded-[16px] border border-line-100 bg-gray-50 p-6 shadow-md hover:bg-oldLace-50 pc:h-[280px] pc:w-[477px] tablet:h-[180px] tablet:w-full"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <h3 className="w-[80%] truncate font-semibold text-black-400 pc:w-[60%] pc:text-2lg">
          {info.title}
        </h3>
        <p className="mt-2 line-clamp-2 h-[48px] w-[80%] text-md text-gray-500 pc:-mt-[60px] pc:w-[60%] pc:text-lg">
          {info.content}
        </p>
        <div className="absolute right-3 top-3 pc:right-6 pc:top-6">
          <PostCardThumbnail imageUrl={info.imageUrl} />
        </div>

        <div className="mt-[20px] flex items-center justify-between gap-2 text-xs not-italic text-gray-500 pc:text-lg">
          <UserInfoInCard
            image={info.writer.imageUrl}
            nickname={info.writer.nickname}
            createdDate={formattedCreatedDate}
          />
          <CommentAndLikeCount
            commentCount={info.commentCount}
            likeCount={info.likeCount}
            isHover={isHover}
          />
        </div>
      </section>
    </Link>
  );
};

export default PostCard;
