// Global patch for Next.js Turbopack Performance.measure negative timestamp issue
// Prevents: "Failed to execute 'measure' on 'Performance': '<PageName>' cannot have a negative time stamp."

if (process.env.NODE_ENV === "development" && typeof globalThis !== "undefined" && globalThis.performance) {
  const perf = globalThis.performance as any;
  if (typeof perf.measure === "function" && !perf.__turbopackPatched) {
    perf.__turbopackPatched = true;
    const origMeasure = perf.measure.bind(perf);
    perf.measure = function (name: string, startOrOptions?: any, end?: any) {
      try {
        if (startOrOptions && typeof startOrOptions === "object") {
          if (typeof startOrOptions.start === "number" && startOrOptions.start < 0) {
            startOrOptions.start = 0;
          }
          if (typeof startOrOptions.end === "number" && startOrOptions.end < 0) {
            startOrOptions.end = 0;
          }
          if (typeof startOrOptions.duration === "number" && startOrOptions.duration < 0) {
            startOrOptions.duration = 0;
          }
        }
        return origMeasure(name, startOrOptions, end);
      } catch {
        return undefined;
      }
    };
  }
}

export {};
