import { assertSecureRuntime } from "../src/lib/runtime-security.ts";
try {
  assertSecureRuntime();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
