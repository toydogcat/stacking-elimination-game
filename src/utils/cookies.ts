/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Clean utilities for cookie management inside the browser sandbox environment.
 * Sets persistent, secure cookies keeping high win streaks and seed completion records intact.
 */
export const cookieHelper = {
  /**
   * Sets a cookie securely in the browser document context.
   */
  set(name: string, value: string, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    
    // Cookie attribute parameters
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
  },

  /**
   * Reads a cookie from document context.
   */
  get(name: string): string | null {
    const searchName = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const parts = decodedCookie.split(';');
    for (let i = 0; i < parts.length; i++) {
      let c = parts[i].trim();
      if (c.indexOf(searchName) === 0) {
        return c.substring(searchName.length, c.length);
      }
    }
    return null;
  },

  /**
   * Fetches parsed map of completed level/seed combinations.
   */
  getCompletedPuzzles(): Record<string, boolean> {
    const raw = this.get('matching_completed_puzzles');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  /**
   * Appends a new level/seed combination to the completed collection inside cookies.
   */
  markPuzzleAsCompleted(levelId: string, seed: number) {
    const records = this.getCompletedPuzzles();
    const puzzleKey = `${levelId}-seed-${seed}`;
    records[puzzleKey] = true;
    this.set('matching_completed_puzzles', JSON.stringify(records));
  },

  /**
   * Verification check if a specific level + seed has already been conquered.
   */
  isPuzzleCompleted(levelId: string, seed: number): boolean {
    const records = this.getCompletedPuzzles();
    return !!records[`${levelId}-seed-${seed}`];
  },

  /**
   * Clean/reset all cookie values for testing/resets.
   */
  clearAllRecords() {
    this.set('matching_completed_puzzles', '{}');
  }
};
