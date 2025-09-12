function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function retryWithBackoff(fn, {
  retries = 3,
  minDelayMs = 300,
  factor = 2,
  jitter = true
} = {}) {
  let attempt = 0;
  let delay = minDelayMs;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      const jitterMs = jitter ? Math.floor(Math.random() * delay * 0.2) : 0;
      await wait(delay + jitterMs);
      delay *= factor;
    }
  }
}

module.exports = { retryWithBackoff }; 