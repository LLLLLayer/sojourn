import {
  installHook,
  uninstallHook,
  isHookInstalled,
  autoAnalyze,
} from "@sojourn/core";

export async function hookInstall(): Promise<void> {
  await installHook();
}

export async function hookUninstall(): Promise<void> {
  await uninstallHook();
}

export async function hookStatus(): Promise<void> {
  const installed = await isHookInstalled();
  console.log(installed ? "✅ Sojourn hook is installed" : "❌ Sojourn hook is not installed");
}

interface AutoAnalyzeOptions {
  session: string;
}

export async function hookAutoAnalyze(options: AutoAnalyzeOptions): Promise<void> {
  await autoAnalyze(options.session);
}
