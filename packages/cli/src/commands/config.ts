import {
  loadConfig,
  getConfigValue,
  setConfigValue,
  getConfigPath,
} from "@sojourn/core";

export async function configShow(): Promise<void> {
  const config = await loadConfig();
  console.log(`Config: ${getConfigPath()}\n`);
  console.log(JSON.stringify(config, null, 2));
}

export async function configGet(key: string): Promise<void> {
  const value = await getConfigValue(key);
  if (value === undefined) {
    console.error(`Key not found: ${key}`);
    process.exit(1);
  }
  if (typeof value === "object") {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(String(value));
  }
}

export async function configSet(key: string, value: string): Promise<void> {
  await setConfigValue(key, value);
  console.log(`Set ${key} = ${value}`);
}
