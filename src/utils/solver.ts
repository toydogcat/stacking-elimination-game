/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile } from '../types';
import { recalculateLocks } from './levels';

/**
 * Serializes the game state for solver memoization.
 * To make it efficient, the key consists of:
 * 1. Remaining active tile IDs (sorted)
 * 2. Emojis in the slot bar (sorted)
 */
function serializeState(tiles: Tile[], slots: Tile[]): string {
  const tileIds = tiles.map(t => t.id).sort().join(',');
  const slotEmojis = slots.map(t => t.emoji).sort().join('');
  return `${tileIds}|${slotEmojis}`;
}

/**
 * Simulates pushing a tile into slots and running match-3 elimination.
 */
function simulatePick(slots: Tile[], tileToPick: Tile): { nextSlots: Tile[]; wasMatch: boolean; matchedEmoji: string | null } {
  const newSlots = [...slots, tileToPick];
  
  // Count emojis
  const counts: Record<string, number> = {};
  newSlots.forEach(s => {
    counts[s.emoji] = (counts[s.emoji] || 0) + 1;
  });

  const matchedEmoji = Object.keys(counts).find(emoji => counts[emoji] >= 3) || null;
  let remainingSlots = newSlots;
  let wasMatch = false;

  if (matchedEmoji) {
    wasMatch = true;
    let count = 0;
    remainingSlots = newSlots.filter(s => {
      if (s.emoji === matchedEmoji && count < 3) {
        count++;
        return false;
      }
      return true;
    });
  }

  return {
    nextSlots: remainingSlots,
    wasMatch,
    matchedEmoji
  };
}

/**
 * Evaluates the "blocking factor": how many tiles are directly or indirectly underneath this tile.
 * This helps the heuristic prioritize removing cards that free up a large amount of options.
 */
function getBlockingScore(tile: Tile, allTiles: Tile[]): number {
  let score = 0;
  for (const other of allTiles) {
    if (other.z < tile.z) {
      // Check X/Y intersection
      const xOverlap = Math.abs(tile.x - other.x) < 2;
      const yOverlap = Math.abs(tile.y - other.y) < 2;
      if (xOverlap && yOverlap) {
        score += (5 - other.z); // Higher weight for deeper cards
      }
    }
  }
  return score;
}

export interface SolveResult {
  solvable: boolean;
  uncertain: boolean; // True if max iterations was reached before finding a complete solution
  solvePath?: string[]; // Array of tile IDs corresponding to the solution sequence
  stepsChecked: number;
}

/**
 * Seedable backtracking solver with state space pruning & prioritized heuristics.
 * Optimized specifically for the constraints of "Sheep A Sheep".
 */
export function verifySolvability(initialTiles: Tile[], maxIterations = 1600): SolveResult {
  const visited = new Set<string>();
  let stepsChecked = 0;

  // Cache blocking scores initially to keep execution times extremely snappy
  const blockingScores = new Map<string, number>();
  initialTiles.forEach(t => {
    blockingScores.set(t.id, getBlockingScore(t, initialTiles));
  });

  // Calculate clean initial locks
  const startTiles = recalculateLocks(initialTiles);

  function search(currentTiles: Tile[], currentSlots: Tile[], path: string[]): { found: boolean; resultPath?: string[] } {
    stepsChecked++;
    
    // Safety check for freezing
    if (stepsChecked > maxIterations) {
      return { found: false };
    }

    // Win condition check
    if (currentTiles.length === 0 && currentSlots.length === 0) {
      return { found: true, resultPath: path };
    }

    // Loss pruning
    if (currentSlots.length >= 7) {
      return { found: false };
    }

    // State dedup key
    const stateKey = serializeState(currentTiles, currentSlots);
    if (visited.has(stateKey)) {
      return { found: false };
    }
    visited.add(stateKey);

    // Get all unlocked cards currently available to pick
    const unlocked = currentTiles.filter(t => !t.isLocked);
    if (unlocked.length === 0) {
      return { found: false };
    }

    // Sort moves heuristically:
    // 1. Forced Matches: If choosing card A instantly completes a set of 3 in the slots, put it as absolute rank 1
    // 2. Pair builders: If choosing card A adds to an existing single item of that type in slots (size 1 -> 2)
    // 3. Unlock weight: Prioritize cards that have a high blocking score (meaning opening them reveals many files beneath)
    const sortedMoves = unlocked.map(tile => {
      const slotCount = currentSlots.filter(s => s.emoji === tile.emoji).length;
      let score = 0;
      
      if (slotCount === 2) {
        score += 10000; // Mega priority: instantly clears slots!
      } else if (slotCount === 1) {
        score += 100; // High priority: ready to match soon
      }
      
      // Add blocking/overlap density
      score += (blockingScores.get(tile.id) || 0) * 5;
      
      // Highly stacked cards are better to remove sooner
      score += tile.z * 10;

      return { tile, score };
    }).sort((a, b) => b.score - a.score);

    // Depth-First Backtracking
    for (const move of sortedMoves) {
      const tile = move.tile;
      
      // Simulate picking this card
      const { nextSlots, wasMatch, matchedEmoji } = simulatePick(currentSlots, tile);
      const nextTiles = currentTiles.filter(t => t.id !== tile.id);
      
      // Re-evaluate locks for the tiles
      const nextTilesWithLocks = recalculateLocks(nextTiles);

      const res = search(nextTilesWithLocks, nextSlots, [...path, tile.id]);
      if (res.found) {
        return res;
      }
    }

    return { found: false };
  }

  const solution = search(startTiles, [], []);
  
  if (solution.found) {
    return {
      solvable: true,
      uncertain: false,
      solvePath: solution.resultPath,
      stepsChecked
    };
  }

  return {
    solvable: false,
    uncertain: stepsChecked > maxIterations,
    stepsChecked
  };
}
