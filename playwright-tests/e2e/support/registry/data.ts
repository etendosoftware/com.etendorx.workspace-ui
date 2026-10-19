/**
 * Test data catalog.
 *
 * Records a spec creates must not collide with the ones a previous run left in the database:
 * locally the database is reused, and `--repeat-each` runs a spec several times against the
 * same database. Every key or name a spec creates goes through {@link uniqueValue}.
 */

/** Workers run in parallel and may start in the same millisecond, so the worker index is part of the id. */
const MAX_WORKERS = 100;
const WORKER_INDEX = Number(process.env.TEST_WORKER_INDEX ?? 0) % MAX_WORKERS;

/** Identifies this run and worker; combined with a counter it makes every generated value unique. */
const RUN_ID = (Date.now() * MAX_WORKERS + WORKER_INDEX).toString(36);
let sequence = 0;

/**
 * Returns `base` with a suffix that is unique across runs and calls, e.g. `60d/10-2xk4m8q1za1`.
 * Keep `base` short: the suffix adds about 12 characters and search keys are usually limited to 40.
 * @param base - readable prefix that identifies the record in screenshots and traces.
 */
export function uniqueValue(base: string): string {
  sequence += 1;
  return `${base}-${RUN_ID}${sequence.toString(36)}`;
}
