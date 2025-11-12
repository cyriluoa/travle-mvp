// src/lib/score.js
export const GameMode = {
  Today: "today",
  Custom: "custom",
};

export class ScoreEngine {
  /**
   * @param {{mode:'today'|'custom', optimalSteps:number, stepsUsed:number, hasQuit?:boolean}} p
   * @returns {{points:number, max:number, perExtra:number, extra:number}}
   */
  compute(p) {
    const hasQuit = !!p.hasQuit;
    if (hasQuit) return { points: 0, max: this.#maxFor(p), perExtra: this.#perExtra(p), extra: 0 };

    const optimal = Math.max(0, p.optimalSteps ?? 0);
    const used = Math.max(0, p.stepsUsed ?? 0);
    const extra = Math.max(0, used - optimal);

    const max = this.#maxFor(p);
    const perExtra = this.#perExtra(p);
    const floor = 10;

    const raw = max - perExtra * extra;
    const points = Math.max(floor, raw);

    return { points, max, perExtra, extra };
  }

  #maxFor(p) {
    if (p.mode === GameMode.Today) return 1000;
    // custom: base = optimalSteps * 50
    return Math.max(0, (p.optimalSteps ?? 0) * 50);
  }

  #perExtra(p) {
    return p.mode === GameMode.Today ? 200 : 30;
  }
}
