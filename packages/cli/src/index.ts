#!/usr/bin/env node
import { Command } from "commander";
import { distill } from "./commands/distill.js";
import { sessions } from "./commands/sessions.js";
import {
  pendingList,
  pendingShow,
  pendingCommit,
  pendingDiscard,
} from "./commands/pending.js";
import {
  hookInstall,
  hookUninstall,
  hookStatus,
  hookAutoAnalyze,
} from "./commands/hooks.js";
import { configShow, configGet, configSet } from "./commands/config.js";
import { repoList, repoBind, repoUnbind, repoSwitch } from "./commands/repo.js";
import { serve } from "./commands/serve.js";
import { doctor } from "./commands/doctor.js";

const program = new Command();

program
  .name("sojourn")
  .description("Distill reusable knowledge from AI coding conversations")
  .version("0.1.0");

// Core commands
program
  .command("distill")
  .description("Distill knowledge from one or more sessions")
  .argument("<sessionPaths...>", "paths to JSONL session files")
  .option("-m, --mode <mode>", "distill mode: thought_tree, sop, workflow, auto", "auto")
  .option("-a, --analyzer <analyzer>", "analyzer: claude-code, claude-api", "claude-code")
  .option("-s, --sink <sink>", "output sink: claude-md, file")
  .option("-o, --output <path>", "output path (used with --sink)")
  .option("--json", "output raw JSON to stdout")
  .option("--save", "save result to pending")
  .action(distill);

program
  .command("sessions")
  .description("List available sessions")
  .option("--agent <agent>", "filter by agent type", "claude-code")
  .action(sessions);

// Pending subcommands
const pending = program
  .command("pending")
  .description("Manage pending distillation results");

pending
  .command("list")
  .description("List all pending results")
  .action(pendingList);

pending
  .command("show <id>")
  .description("Show a pending result")
  .action(pendingShow);

pending
  .command("commit <id>")
  .description("Commit a pending result to a sink")
  .option("-s, --sink <sink>", "output sink: claude-md, file", "claude-md")
  .option("-o, --output <path>", "output path", "./CLAUDE.md")
  .action(pendingCommit);

pending
  .command("discard <id>")
  .description("Discard a pending result")
  .action(pendingDiscard);

// Config subcommands
const config = program
  .command("config")
  .description("Manage Sojourn configuration");

config
  .command("show")
  .description("Show full configuration")
  .action(configShow);

config
  .command("get <key>")
  .description("Get a config value (dot notation: analyzers.claude-code.model)")
  .action(configGet);

config
  .command("set <key> <value>")
  .description("Set a config value")
  .action(configSet);

// Repo subcommands
const repo = program
  .command("repo")
  .description("Manage shared knowledge Git repositories");

repo
  .command("list")
  .description("List bound repositories")
  .action(repoList);

repo
  .command("bind <name> <url>")
  .description("Bind a Git repository for team sharing")
  .action(repoBind);

repo
  .command("unbind <name>")
  .description("Unbind a repository")
  .action(repoUnbind);

repo
  .command("switch <name>")
  .description("Switch active repository")
  .action(repoSwitch);

// Hook commands
program
  .command("install-hook")
  .description("Install Sojourn hook into Claude Code settings")
  .action(hookInstall);

program
  .command("uninstall-hook")
  .description("Remove Sojourn hook from Claude Code settings")
  .action(hookUninstall);

program
  .command("hook-status")
  .description("Check if Sojourn hook is installed")
  .action(hookStatus);

program
  .command("auto-analyze")
  .description("Auto-analyze a session (called by hook)")
  .requiredOption("--session <sessionId>", "session ID to analyze")
  .action(hookAutoAnalyze);

// Server
program
  .command("serve")
  .description("Start the Sojourn Web GUI")
  .option("-p, --port <port>", "port number", "7878")
  .action(serve);

// Maintenance
program
  .command("doctor")
  .description("Check environment, configuration, and connectivity")
  .action(doctor);

program.parse();
