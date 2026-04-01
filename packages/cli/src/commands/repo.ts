import {
  bindRepo,
  unbindRepo,
  switchRepo,
  getActiveRepo,
  loadConfig,
} from "@sojourn/core";

export async function repoList(): Promise<void> {
  const config = await loadConfig();
  const repos = config.git.repos;

  if (repos.length === 0) {
    console.log("No repos bound. Run: sojourn repo bind <name> <url>");
    return;
  }

  for (const repo of repos) {
    const active = repo.name === config.git.activeRepo ? " ← active" : "";
    console.log(`  ${repo.name}  ${repo.url}${active}`);
  }
}

export async function repoBind(name: string, url: string): Promise<void> {
  await bindRepo(name, url);
  console.log(`Bound repo "${name}" → ${url}`);

  const active = await getActiveRepo();
  if (active?.name === name) {
    console.log(`Set as active repo.`);
  }
}

export async function repoUnbind(name: string): Promise<void> {
  await unbindRepo(name);
  console.log(`Unbound repo "${name}"`);
}

export async function repoSwitch(name: string): Promise<void> {
  await switchRepo(name);
  console.log(`Switched active repo to "${name}"`);
}
