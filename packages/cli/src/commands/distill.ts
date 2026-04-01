import {
  parserRegistry,
  analyzerRegistry,
  classify,
  classifyMulti,
  detectFormat,
  ClaudeMdSink,
  FileSink,
  GitRepoSink,
  MemorySink,
  savePending,
  getActiveRepo,
} from "@sojourn/core";
import {
  isLinear,
  type MessageTree,
  type ThoughtTreeResult,
  type SOPResult,
  type DistillMode,
} from "@sojourn/shared";

interface DistillOptions {
  mode?: string;
  analyzer?: string;
  sink?: string;
  output?: string;
  json?: boolean;
  save?: boolean;
}

export async function distill(
  sessionPaths: string[],
  options: DistillOptions
): Promise<void> {
  // Parse all sessions (auto-detect format)
  const trees: MessageTree[] = [];
  for (const path of sessionPaths) {
    const format = await detectFormat(path);
    const parserName = format === "unknown" ? "claude-code" : format;
    const parser = parserRegistry.get(parserName);
    console.error(`Parsing: ${path} (${parserName})`);
    const tree = await parser.parse(path);
    const linear = isLinear(tree);
    console.error(
      `  ${tree.messages.size} messages, ${linear ? "linear" : "branching"}`
    );
    trees.push(tree);
  }

  // Determine mode
  let mode: Exclude<DistillMode, "auto">;
  if (options.mode && options.mode !== "auto") {
    mode = options.mode as Exclude<DistillMode, "auto">;
  } else if (trees.length > 1) {
    mode = classifyMulti(trees);
  } else {
    mode = classify(trees[0]);
  }
  console.error(`Mode: ${mode}`);

  // Analyze
  const analyzerName = options.analyzer ?? "claude-code";
  const analyzer = analyzerRegistry.get(analyzerName);
  console.error(`Analyzing with ${analyzerName}...\n`);

  const result =
    trees.length > 1
      ? await analyzer.analyzeMulti(trees, mode)
      : await analyzer.analyze(trees[0], mode);

  // Save to pending if requested
  if (options.save) {
    const id = await savePending(
      trees.map((t) => t.sessionId),
      result
    );
    console.error(`Saved to pending: ${id}`);
  }

  // Write to sink if specified
  if (options.sink) {
    const outputPath = options.output ?? "./CLAUDE.md";
    if (options.sink === "claude-md") {
      const sink = new ClaudeMdSink(outputPath);
      await sink.write(result);
      console.error(`Written to ${outputPath}`);
    } else if (options.sink === "file") {
      const format = outputPath.endsWith(".json") ? "json" as const : "markdown" as const;
      const sink = new FileSink(outputPath, format);
      await sink.write(result);
      console.error(`Written to ${outputPath}`);
    } else if (options.sink === "git-repo") {
      const repo = await getActiveRepo();
      if (!repo) {
        console.error("No active repo. Run: sojourn repo bind <name> <url>");
        process.exit(1);
      }
      const sink = new GitRepoSink({ repoUrl: repo.url, repoName: repo.name });
      await sink.write(result);
    } else if (options.sink === "memory") {
      const sink = new MemorySink();
      await sink.write(result);
      console.error("Written to Claude Code memory");
    }
    return;
  }

  // Output to stdout
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Pretty print
  if (result.type === "thought_tree") {
    printThoughtTree(result as ThoughtTreeResult);
  } else if (result.type === "sop") {
    printSOP(result as SOPResult);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

function printThoughtTree(result: ThoughtTreeResult): void {
  console.log(`# ${result.rootQuestion}\n`);
  if (result.summary) console.log(`> ${result.summary}\n`);

  // Build parent→children map
  const childMap = new Map<string | null, typeof result.nodes>();
  for (const node of result.nodes) {
    const key = node.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(node);
  }

  function printNode(nodeId: string | null, indent: string): void {
    const children = childMap.get(nodeId) ?? [];
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      const isLast = i === children.length - 1;
      const prefix = indent + (isLast ? "└─ " : "├─ ");
      const childIndent = indent + (isLast ? "   " : "│  ");

      const typeTag = `[${node.nodeType}]`.padEnd(17);
      console.log(`${prefix}${typeTag} ${node.label}`);
      if (node.reason) {
        console.log(`${childIndent}  reason: ${node.reason}`);
      }
      printNode(node.id, childIndent);
    }
  }

  printNode(null, "");
}

function printSOP(result: SOPResult): void {
  console.log(`# ${result.title}\n`);
  if (result.summary) console.log(`> ${result.summary}\n`);

  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    console.log(`${i + 1}. ${step.description}`);
    if (step.precondition) {
      console.log(`   precondition: ${step.precondition}`);
    }
    if (step.failureBranch) {
      console.log(`   on failure: ${step.failureBranch}`);
    }
  }
}
