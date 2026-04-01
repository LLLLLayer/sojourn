import { startServer } from "@sojourn/server";

interface ServeOptions {
  port?: string;
}

export async function serve(options: ServeOptions): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 7878;
  startServer(port);

  // Open browser
  const url = `http://localhost:${port}`;
  try {
    const { exec } = await import("child_process");
    const cmd =
      process.platform === "darwin"
        ? `open ${url}`
        : process.platform === "win32"
          ? `start ${url}`
          : `xdg-open ${url}`;
    exec(cmd);
  } catch {
    // ignore
  }
}
