import { readdir, stat } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

interface SessionsOptions {
  agent: string;
}

export async function sessions(options: SessionsOptions): Promise<void> {
  const claudeProjectsDir = join(homedir(), ".claude", "projects");

  try {
    const projects = await readdir(claudeProjectsDir);

    let totalSessions = 0;

    for (const project of projects) {
      const projectDir = join(claudeProjectsDir, project);
      const projectStat = await stat(projectDir);
      if (!projectStat.isDirectory()) continue;

      const files = await readdir(projectDir);
      const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

      if (jsonlFiles.length === 0) continue;

      const projectName = decodeURIComponent(project).replace(
        /^-/,
        "/"
      );
      console.log(`\n${projectName}`);

      for (const file of jsonlFiles) {
        const filePath = join(projectDir, file);
        const fileStat = await stat(filePath);
        const sessionId = file.replace(".jsonl", "");
        const modified = fileStat.mtime.toISOString().slice(0, 16).replace("T", " ");
        const sizeKB = Math.round(fileStat.size / 1024);

        console.log(`  ${modified}  ${sizeKB}KB  ${sessionId}`);
        totalSessions++;
      }
    }

    console.log(`\n${totalSessions} sessions found`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("No Claude Code sessions found at ~/.claude/projects/");
    } else {
      throw err;
    }
  }
}
