/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tile {
  id: string;
  emoji: string;
  x: number; // Grid X coordinate (tile spans 2 units, i.e., [x, x + 2))
  y: number; // Grid Y coordinate (tile spans 2 units, i.e., [y, y + 2))
  z: number; // Layer (elevation), 0 is base layer, higher numbers are stacked
  isLocked: boolean; // Checked dynamically when cards overlap in X/Y but have higher Z
}

export type LevelType = 'tutorial' | 'classic' | 'castle' | 'cross' | 'custom';

export interface LevelConfig {
  id: LevelType;
  name: string;
  subtitle: string;
  description: string;
  difficulty: '簡單' | '困難' | '地獄' | '考驗' | '自訂';
  emojis: string[];
  maxLayers: number;
}

export interface CustomLevelSettings {
  seed: number;
  emojiCount: number; // 3 to 15 types of emojis
  layoutTemplate: 'pyramid' | 'fortress' | 'grid'; // Layout pattern template
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  currentStreak: number;
}

