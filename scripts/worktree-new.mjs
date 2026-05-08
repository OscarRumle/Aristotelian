#!/usr/bin/env node
// Create a new git worktree off main for parallel work.
//
// Usage:
//   npm run worktree:new -- <branch-name>
//
// Creates ../Aristotelian-<short-name> as a sibling folder, checked out to a
// new branch <branch-name> off origin/main. Open a separate Claude Code
// session pointed at the new folder to work on it independently.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";

const branch = process.argv[2];
if (!branch) {
  console.error("Usage: npm run worktree:new -- <branch-name>");
  console.error("Example: npm run worktree:new -- feat/comic-style");
  process.exit(1);
}

const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const repoName = basename(repoRoot);
const parent = dirname(repoRoot);
const shortName = branch.replace(/^(feat|feature|fix|chore|docs)\//, "").replace(/[^a-zA-Z0-9-]/g, "-");
const worktreePath = resolve(parent, `${repoName}-${shortName}`);

if (existsSync(worktreePath)) {
  console.error(`Worktree path already exists: ${worktreePath}`);
  process.exit(1);
}

const run = (cmd) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

run("git fetch origin main");
run(`git worktree add -b ${branch} "${worktreePath}" origin/main`);

console.log("");
console.log(`✓ Worktree created at ${worktreePath}`);
console.log(`  Branch: ${branch} (off origin/main)`);
console.log("");
console.log("Next steps:");
console.log(`  1. cd "${worktreePath}"`);
console.log("  2. npm install   # node_modules is per-worktree");
console.log("  3. Open a new Claude Code session in that folder");
