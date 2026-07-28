"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Check, RotateCcw, Trash2 } from "lucide-react";
import {
  createCityIssueAction,
  deleteCityIssueAction,
  reopenCityIssueAction,
  resolveCityIssueAction,
} from "@/app/actions/cities";
import { formatDate } from "@/lib/utils";
import { FoldableText } from "@/components/foldable-text";

type CityIssue = {
  id: string;
  type: string;
  content: string;
  status: string;
  resolveOutcome: string | null;
  createdAt: string | Date;
  resolvedAt: string | Date | null;
};

export function CityIssuesPanel({
  cityId,
  issues,
}: {
  cityId: string;
  issues: CityIssue[];
}) {
  const teamOpen = issues.filter((i) => i.type === "team" && i.status === "open");
  const teamArchived = issues.filter(
    (i) => i.type === "team" && i.status === "resolved",
  );
  const businessOpen = issues.filter(
    (i) => i.type === "business" && i.status === "open",
  );
  const businessArchived = issues.filter(
    (i) => i.type === "business" && i.status === "resolved",
  );

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-2">
      <IssueColumn
        title="团队问题"
        cityId={cityId}
        type="team"
        openItems={teamOpen}
        archivedItems={teamArchived}
      />
      <IssueColumn
        title="业务问题"
        cityId={cityId}
        type="business"
        openItems={businessOpen}
        archivedItems={businessArchived}
      />
    </section>
  );
}

function IssueColumn({
  title,
  cityId,
  type,
  openItems,
  archivedItems,
}: {
  title: string;
  cityId: string;
  type: "team" | "business";
  openItems: CityIssue[];
  archivedItems: CityIssue[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showArchive, setShowArchive] = useState(false);
  const [showAllOpen, setShowAllOpen] = useState(false);

  const visibleOpen = showAllOpen ? openItems : openItems.slice(0, 2);
  const hiddenOpenCount = Math.max(0, openItems.length - 2);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await createCityIssueAction({
        cityId,
        type,
        content: String(formData.get("content") ?? ""),
      });
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-medium text-stone-900">{title}</h3>
        {openItems.length ? (
          <span className="text-xs text-stone-400">进行中 {openItems.length}</span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {openItems.length ? (
          <>
            {visibleOpen.map((issue) => (
              <OpenIssueRow key={issue.id} issue={issue} cityId={cityId} />
            ))}
            {hiddenOpenCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllOpen((value) => !value)}
                className="w-full rounded-xl border border-dashed border-stone-200 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50"
              >
                {showAllOpen
                  ? "收起多余问题"
                  : `还有 ${hiddenOpenCount} 条进行中`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-stone-400">暂无进行中的问题</p>
        )}
      </div>

      <form action={handleAdd} className="mt-4 flex gap-2">
        <input
          name="content"
          required
          placeholder={`添加${title}…`}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          添加
        </button>
      </form>

      {archivedItems.length ? (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={() => setShowArchive((value) => !value)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm text-stone-500">
              <Archive className="h-4 w-4" />
              已归档（{archivedItems.length}）
            </span>
            <span className="text-xs text-stone-400">
              {showArchive ? "收起" : "展开"}
            </span>
          </button>
          {showArchive ? (
            <div className="mt-3 space-y-3">
              {archivedItems.map((issue) => (
                <ArchivedIssueRow
                  key={issue.id}
                  issue={issue}
                  cityId={cityId}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OpenIssueRow({
  issue,
  cityId,
}: {
  issue: CityIssue;
  cityId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resolving, setResolving] = useState(false);
  const [outcome, setOutcome] = useState("");

  function handleResolve() {
    startTransition(async () => {
      await resolveCityIssueAction(issue.id, cityId, outcome);
      setResolving(false);
      setOutcome("");
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white px-4 py-3">
      <FoldableText text={issue.content} className="text-stone-800" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-stone-400">
          记录于 {formatDate(issue.createdAt)}
        </span>
        <div className="flex shrink-0 gap-1">
          {!resolving ? (
            <button
              type="button"
              onClick={() => setResolving(true)}
              className="rounded-lg px-2 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              标记完成
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteCityIssueAction(issue.id, cityId);
                router.refresh();
              })
            }
            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {resolving ? (
        <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
          <label className="block text-xs font-medium text-stone-600">
            结果 / 后续（选填）
          </label>
          <textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            rows={2}
            placeholder="例如：对方已排期 8 月上线；或改走内部方案"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleResolve}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              确认归档
            </button>
            <button
              type="button"
              onClick={() => {
                setResolving(false);
                setOutcome("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArchivedIssueRow({
  issue,
  cityId,
}: {
  issue: CityIssue;
  cityId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white px-4 py-3">
      <FoldableText text={issue.content} />
      {issue.resolveOutcome ? (
        <p className="mt-2 break-words rounded-lg bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-600">
          <span className="font-medium text-stone-700">结果：</span>
          {issue.resolveOutcome}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-stone-400">
          完成于 {issue.resolvedAt ? formatDate(issue.resolvedAt) : "—"}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await reopenCityIssueAction(issue.id, cityId);
                router.refresh();
              })
            }
            className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
            title="重新打开"
          >
            <RotateCcw className="mr-1 inline h-3 w-3" />
            重新打开
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteCityIssueAction(issue.id, cityId);
                router.refresh();
              })
            }
            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
