#!/usr/bin/env node
// Remove a git worktree by branch name. Safe — refuses if the worktree has
// uncommitted changes. After removing, also deletes the local branch if it's
// fully merged.
//
// Usage:
//   npm run worktree:rm -- <branch-name>

import { execSync } from "node:child_process";

const branch = process.argv[2];
if (!branch) {
  console.error("Usage: npm run worktree:rm -- <branch-name>");
  process.exit(1);
}

const list = execSync("git worktree list --porcelain", { encoding: "utf8" });
const blocks = list.split("\n\n").filter(Boolean);
const match = blocks.find((b) => b.includes(`branch refs/heads/${branch}`));
if (!match) {
  console.error(`No worktree found for branch '${branch}'.`);
  console.error("Active worktrees:");
  console.error(execSync("git worktree list", { encoding: "utf8" }));
  process.exit(1);
}

const wtPath = match.split("\n")[0].replace(/^worktree\s+/, "").trim();
const run = (cmd) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

run(`git worktree remove "${wtPath}"`);
try {
  run(`git branch -d ${branch}`);
  console.log(`✓ Removed worktree and deleted local branch '${branch}'.`);
} catch {
  console.log(`✓ Removed worktree. Local branch '${branch}' kept (unmerged).`);
  console.log(`  Force-delete with: git branch -D ${branch}`);
}
