"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { routeQuestion } from "@/lib/actions/questions";
import {
  Card,
  SectionHeader,
  buttonClass,
  fieldClass,
} from "@/components/ui/kit";

type QuestionOption = {
  id: number;
  title: string | null;
  body: string;
  authorName: string | null;
};
type PersonOption = { userId: string; name: string | null };

export function RouteQuestionAdmin({
  questions,
  people,
}: {
  questions: QuestionOption[];
  people: PersonOption[];
}) {
  const t = useTranslations("admin.route");
  const [postId, setPostId] = useState("");
  const [userId, setUserId] = useState("");
  const [pending, startTransition] = useTransition();

  function onRoute() {
    if (!postId || !userId) return;
    startTransition(async () => {
      await routeQuestion({ postId: Number(postId), userId });
      setPostId("");
      setUserId("");
    });
  }

  return (
    <Card className="p-4">
      <SectionHeader>{t("title")}</SectionHeader>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          {t("pickQuestion")}
          <select
            className={fieldClass}
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          >
            <option value="">—</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {(q.title || q.body).slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t("pickPerson")}
          <select
            className={fieldClass}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.name || p.userId.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className={buttonClass("primary", "mt-3")}
        disabled={pending || !postId || !userId}
        onClick={onRoute}
      >
        {t("route")}
      </button>
    </Card>
  );
}
