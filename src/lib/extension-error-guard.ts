/** Development overlay isolation for a known injected extension; app errors stay visible. */
export const extensionErrorGuardScript = String.raw`(() => {
  const prefix = 'chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/';
  function injected(filename, error) {
    if (filename && !filename.startsWith(prefix)) return false;
    const stack = error && typeof error.stack === 'string' ? error.stack : '';
    const frames = stack.split('\n').filter(line => /^\s*at\s/.test(line));
    const urls = frames.flatMap(line => line.match(/(?:https?|file|chrome-extension|moz-extension|safari-extension):\/\/[^\s)]+/g) || []);
    if (urls.some(url => !url.startsWith(prefix))) return false;
    return Boolean((filename && filename.startsWith(prefix)) || (urls.length && urls.every(url => url.startsWith(prefix))));
  }
  window.addEventListener('error', event => {
    if (injected(event.filename || '', event.error)) event.stopImmediatePropagation();
  }, true);
  window.addEventListener('unhandledrejection', event => {
    if (injected('', event.reason)) event.stopImmediatePropagation();
  }, true);
})();`;
