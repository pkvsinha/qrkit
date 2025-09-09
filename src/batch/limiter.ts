export class TokenBucket {
  constructor(
    public capacity: number,
    public refillRate: number,
    public tokens = capacity,
    public last = performance.now(),
  ) {}
  take(n = 1) {
    const now = performance.now();
    const delta = (now - this.last) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + delta * this.refillRate,
    );
    this.last = now;
    if (this.tokens >= n) {
      this.tokens -= n;
      return true;
    }
    return false;
  }
}
