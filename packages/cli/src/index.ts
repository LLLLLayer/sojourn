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

const program = new Command();

program
  .name("sojourn")
  .description("Distill reusable knowledge from AI coding conversations")
  .version("0.1.0");

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

program.parse();
