import { globalCalloutManager } from "@/services/callouts";

describe("GlobalCalloutManager", () => {
  it("suppresses and resumes callouts", () => {
    expect(globalCalloutManager.isSuppressed()).toBe(false);
    globalCalloutManager.suppress();
    expect(globalCalloutManager.isSuppressed()).toBe(true);
    globalCalloutManager.suppress();
    expect(globalCalloutManager.isSuppressed()).toBe(true);
    globalCalloutManager.resume();
    expect(globalCalloutManager.isSuppressed()).toBe(true);
    globalCalloutManager.resume();
    expect(globalCalloutManager.isSuppressed()).toBe(false);
  });

  it("executes queued callouts sequentially", async () => {
    const order: string[] = [];
    await Promise.all([
      globalCalloutManager.executeCallout("A", async () => {
        order.push("A-start");
        await new Promise((r) => setTimeout(r, 10));
        order.push("A-end");
      }),
      globalCalloutManager.executeCallout("B", async () => {
        order.push("B-start");
        await new Promise((r) => setTimeout(r, 5));
        order.push("B-end");
      }),
    ]);

    // Ensure A runs fully before B (sequential)
    const aStart = order.indexOf("A-start");
    const aEnd = order.indexOf("A-end");
    const bStart = order.indexOf("B-start");
    const bEnd = order.indexOf("B-end");
    expect(aStart).toBeLessThan(aEnd);
    expect(aEnd).toBeLessThan(bStart);
    expect(bStart).toBeLessThan(bEnd);
  });

  it("resolves waitForIdle when all callouts are complete", async () => {
    // Start a callout that blocks
    let resolveCallout: () => void;
    const calloutPromise = globalCalloutManager.executeCallout("C", async () => {
      await new Promise<void>((r) => {
        resolveCallout = r;
      });
    });

    // waitForIdle should not resolve yet
    let isIdle = false;
    const idlePromise = globalCalloutManager.waitForIdle().then(() => {
      isIdle = true;
    });

    // Wait a bit to ensure it hasn't resolved
    await new Promise((r) => setTimeout(r, 20));
    expect(isIdle).toBe(false);

    // Resolve the callout
    resolveCallout!();
    await calloutPromise;

    // Now waitForIdle should resolve
    await idlePromise;
    expect(isIdle).toBe(true);
  });
});
