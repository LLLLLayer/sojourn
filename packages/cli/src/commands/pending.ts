import {
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
  commitToSink,
} from "@sojourn/core";

export async function pendingList(): Promise<void> {
  const items = await listPending();

  if (items.length === 0) {
    console.log("No pending results.");
    return;
  }

  for (const item of items) {
    const status =
      item.status === "pending"
        ? "⏳"
        : item.status === "committed"
          ? "✅"
          : item.status === "discarded"
            ? "🗑️"
            : "📝";
    console.log(
      `${status} ${item.id}  ${item.resultType.padEnd(13)} ${item.createdAt.slice(0, 16)}  sessions: ${item.sessionIds.length}`
    );
  }

  console.log(
    `\n${items.filter((i) => i.status === "pending").length} pending`
  );
}

export async function pendingShow(id: string): Promise<void> {
  const item = await getPending(id);
  if (!item) {
    console.error(`Not found: ${id}`);
    process.exit(1);
  }
  console.log(JSON.stringify(item, null, 2));
}

interface CommitOptions {
  sink?: string;
  output?: string;
}

export async function pendingCommit(
  id: string,
  options: CommitOptions
): Promise<void> {
  const item = await getPending(id);
  if (!item) {
    console.error(`Not found: ${id}`);
    process.exit(1);
  }

  const sinkName = options.sink ?? "claude-md";
  await commitToSink(item.resultData, { sink: sinkName, outputPath: options.output });
  await updatePendingStatus(id, "committed", sinkName);
  console.log(`Committed ${id} → ${sinkName}`);
}

export async function pendingDiscard(id: string): Promise<void> {
  await discardPending(id);
  console.log(`Discarded ${id}`);
}
