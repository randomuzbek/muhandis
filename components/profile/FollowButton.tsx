"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleFollow } from "@/lib/actions/follow";
import { buttonClass } from "@/components/ui/kit";

export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const t = useTranslations("profile");
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const prev = following;
    setFollowing(!prev); // iyimser
    const res = await toggleFollow(targetUserId);
    setPending(false);
    if (!res.ok) setFollowing(prev);
    else setFollowing(res.following);
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={buttonClass(following ? "secondary" : "primary")}
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}
