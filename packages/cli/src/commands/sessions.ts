import { listSessions } from "@sojourn/core";

interface SessionsOptions {
  agent: string;
}

export async function sessions(_options: SessionsOptions): Promise<void> {
  const allSessions = await listSessions();

  if (allSessions.length === 0) {
    console.log("No sessions found.");
    return;
  }

  // Group by project
  const grouped = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    if (!grouped.has(s.project)) grouped.set(s.project, []);
    grouped.get(s.project)!.push(s);
  }

  for (const [project, items] of grouped) {
    console.log(`\n${project}`);
    for (const s of items) {
      const modified = s.modified.toISOString().slice(0, 16).replace("T", " ");
      const size = String(s.sizeKB).padStart(5) + "KB";
      console.log(`  ${modified}  ${size}  ${s.sessionId}`);
    }
  }

  console.log(`\n${allSessions.length} sessions found`);
}
