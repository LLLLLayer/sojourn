import { readFile, writeFile, readdir, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { AnalysisResult, DistillMode } from "@sojourn/shared";
import type { PendingResult, PendingStatus } from "@sojourn/shared";

const PENDING_DIR = join(homedir(), ".sojourn", "pending");

async function ensureDir(): Promise<void> {
  await mkdir(PENDING_DIR, { recursive: true });
}

export async function savePending(
  sessionIds: string[],
  result: AnalysisResult
): Promise<string> {
  await ensureDir();

  const id = randomUUID().slice(0, 8);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${id}.json`;

  const pending: PendingResult = {
    id,
    sessionIds,
    resultType: result.type as DistillMode,
    resultData: result,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    committedTo: null,
  };

  await writeFile(
    join(PENDING_DIR, filename),
    JSON.stringify(pending, null, 2),
    "utf-8"
  );

  return id;
}

export async function listPending(
  status?: PendingStatus
): Promise<PendingResult[]> {
  await ensureDir();

  const files = await readdir(PENDING_DIR);
  const results: PendingResult[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await readFile(join(PENDING_DIR, file), "utf-8");
    const pending = JSON.parse(content) as PendingResult;
    if (!status || pending.status === status) {
      results.push(pending);
    }
  }

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPending(id: string): Promise<PendingResult | null> {
  await ensureDir();

  const files = await readdir(PENDING_DIR);
  for (const file of files) {
    if (!file.includes(id)) continue;
    const content = await readFile(join(PENDING_DIR, file), "utf-8");
    return JSON.parse(content) as PendingResult;
  }
  return null;
}

export async function updatePendingStatus(
  id: string,
  status: PendingStatus,
  committedTo?: string
): Promise<void> {
  await ensureDir();

  const files = await readdir(PENDING_DIR);
  for (const file of files) {
    if (!file.includes(id)) continue;
    const filePath = join(PENDING_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const pending = JSON.parse(content) as PendingResult;
    pending.status = status;
    pending.updatedAt = new Date().toISOString();
    if (committedTo) pending.committedTo = committedTo;
    await writeFile(filePath, JSON.stringify(pending, null, 2), "utf-8");
    return;
  }
  throw new Error(`Pending result ${id} not found`);
}

export async function discardPending(id: string): Promise<void> {
  await updatePendingStatus(id, "discarded");
}
