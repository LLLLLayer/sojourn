#!/usr/bin/env node
import { Command } from "commander";
import { distill } from "./commands/distill.js";
import { sessions } from "./commands/sessions.js";

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
  .option("--json", "output raw JSON instead of pretty print")
  .action(distill);

program
  .command("sessions")
  .description("List available sessions")
  .option("--agent <agent>", "filter by agent type", "claude-code")
  .action(sessions);

program.parse();
