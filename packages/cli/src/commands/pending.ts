import {
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
  ClaudeMdSink,
  FileSink,
  GitRepoSink,
  MemorySink,
  getActiveRepo,
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
  const outputPath = options.output ?? "./CLAUDE.md";

  if (sinkName === "claude-md") {
    const sink = new ClaudeMdSink(outputPath);
    await sink.write(item.resultData);
  } else if (sinkName === "file") {
    const format = outputPath.endsWith(".json")
      ? ("json" as const)
      : ("markdown" as const);
    const sink = new FileSink(outputPath, format);
    await sink.write(item.resultData);
  } else if (sinkName === "git-repo") {
    const repo = await getActiveRepo();
    if (!repo) {
      console.error("No active repo. Run: sojourn repo bind <name> <url>");
      process.exit(1);
    }
    const sink = new GitRepoSink({ repoUrl: repo.url, repoName: repo.name });
    await sink.write(item.resultData);
  } else if (sinkName === "memory") {
    await new MemorySink().write(item.resultData);
  }

  await updatePendingStatus(id, "committed", sinkName);
  console.log(`Committed ${id} → ${sinkName} (${outputPath})`);
}

export async function pendingDiscard(id: string): Promise<void> {
  await discardPending(id);
  console.log(`Discarded ${id}`);
}
