// The base a branch is compared with by perf:compare: the merge-base with the target branch, or the tip of
// the target when the clone is too shallow to have it (CI clones with little history).

/**
 * @param {(...args: string[]) => string} git returns stdout, throws when git fails
 * @param {string} target e.g. "origin/main"
 * @returns {{ baseSha: string, baseIsTip: boolean }}
 */
export function mergeBaseOrTip(git, target) {
  try {
    return { baseSha: git("merge-base", "HEAD", target), baseIsTip: false };
  } catch {
    return { baseSha: git("rev-parse", target), baseIsTip: true };
  }
}

/** The "Base" line of the report: which commit of the target was measured. */
export function baseLine({ target, baseSha, baseIsTip }) {
  const sha = baseSha.slice(0, 9);
  if (baseIsTip) return `- **Base:** \`${target}\` tip \`${sha}\` (no merge-base in this clone)`;
  return `- **Base:** \`${target}\` merge-base \`${sha}\``;
}
