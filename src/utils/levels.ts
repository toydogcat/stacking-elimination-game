/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile, LevelConfig, LevelType, CustomLevelSettings } from '../types';

// Large, beautiful pool of agricultural and pasture-themed emojis
export const EMOJI_POOL = [
  '🐑', // Sheep (The star!)
  '🥕', // Carrot
  '🌲', // Tree
  '🥛', // Milk
  '🔔', // Bell
  '🌾', // Wheat
  '🪵', // Wood block
  '🍎', // Red apple
  '🍄', // Mushroom
  '🌽', // Sweet corn
  '🍯', // Honey jar
  '🎃', // Pumpkin
  '🥬', // Cabbage
  '🥚', // Egg
  '🌻', // Sunflower
  '🍇', // Grapes
  '🍓', // Strawberry
  '🍒', // Cherry
  '🍋', // Lemon
  '🧅', // Onion
];

// Configure standard levels
export const LEVEL_DEFS: Record<LevelType, LevelConfig> = {
  tutorial: {
    id: 'tutorial',
    name: '新手牧場',
    subtitle: '教學關卡 • 輕鬆入門',
    description: '此關卡專為新手設計，只有 2 層、24 張卡牌，主要用來熟悉基本的堆疊、遮擋與消除規則，絕對輕鬆通關！',
    difficulty: '簡單',
    emojis: ['🐑', '🥕', '🌲', '🥛'],
    maxLayers: 2,
  },
  classic: {
    id: 'classic',
    name: '金字塔之巔',
    subtitle: '核心模式 • 高空對稱',
    description: '經典的 5 層埃及金字塔形制，由下往上向中心收窄，卡牌層層錯落咬合。請注意多層覆蓋的中央卡牌，極具對稱美學。',
    difficulty: '考驗',
    emojis: ['🐑', '🥕', '🌲', '🥛', '🔔', '🌾', '🪵', '🍎'],
    maxLayers: 5,
  },
  castle: {
    id: 'castle',
    name: '羊羊古堡',
    subtitle: '四神獸塔樓 • 空間重疊',
    description: '經典地獄難度！四周設有四座堆疊達 5 層的高聳角樓，中央則是一片低矮的連廊。如果不及時消解角樓，底部會被死死卡住！',
    difficulty: '困難',
    emojis: ['🐑', '🥕', '🌲', '🥛', '🔔', '🌾', '🪵', '🍎', '🍄', '🌽', '🍯', '🎃'],
    maxLayers: 6,
  },
  cross: {
    id: 'cross',
    name: '無盡雙十字',
    subtitle: '對角線拉扯 • 中軸圍攻',
    description: '十字形對稱堆疊。牌局在正中央、水平中軸與垂直中軸線上凝聚了大量的超高層卡牌，邊緣則極為稀疏，是一場對專注力的極致考驗。',
    difficulty: '地獄',
    emojis: ['🐑', '🥕', '🌲', '🥛', '🔔', '🌾', '🪵', '🍎', '🍄', '🌽', '🍯', '🎃', '🥬', '🥚', '🌻'],
    maxLayers: 6,
  },
  custom: {
    id: 'custom',
    name: '大師自訂局',
    subtitle: '無限生成 • 種子配方',
    description: '完全由您自訂卡牌種類、佈局與數值種子。輸入特定數字，便可生成獨一無二的固定關卡，方便分享給好友PK勝負！',
    difficulty: '自訂',
    emojis: [], // Filled dynamically based on state
    maxLayers: 5,
  }
};

/**
 * Seedable Linear Congruential Generator / Mulberry32-inspired PRNG
 * Produces deterministic pseudo-random floats in [0, 1) based on a numeric seed.
 */
export function createPRNG(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic seed-based array shuffle
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const rand = createPRNG(seed);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Procedural layout generator that creates the coordinate scaffolding (x, y, z) for each level.
 * Cards are 2x2 grid spaces. Coordinates can be offset by 1 grid space (half card width/height) to support staggered stacking.
 */
function generateRawPositions(type: LevelType, customSettings?: CustomLevelSettings): { x: number; y: number; z: number }[] {
  const positions: { x: number; y: number; z: number }[] = [];

  // Handlers for standard levels
  if (type === 'tutorial') {
    for (let x = 2; x <= 8; x += 2) {
      for (let y = 2; y <= 6; y += 2) {
        positions.push({ x, y, z: 0 });
      }
    }
    for (const x of [3, 5, 7]) {
      for (const y of [3, 5]) {
        positions.push({ x, y, z: 1 });
      }
    }
    return positions;
  }

  if (type === 'classic') {
    for (let x = 1; x <= 11; x += 2) {
      for (let y = 1; y <= 11; y += 2) {
        if ((x === 1 || x === 11) && (y === 1 || y === 11)) continue;
        positions.push({ x, y, z: 0 });
      }
    }
    for (let x = 2; x <= 10; x += 2) {
      for (let y = 2; y <= 10; y += 2) {
        positions.push({ x, y, z: 1 });
      }
    }
    for (let x = 3; x <= 9; x += 2) {
      for (let y = 3; y <= 9; y += 2) {
        positions.push({ x, y, z: 2 });
      }
    }
    for (let x = 4; x <= 8; x += 2) {
      for (let y = 4; y <= 8; y += 2) {
        positions.push({ x, y, z: 3 });
      }
    }
    for (let x = 5; x <= 7; x += 2) {
      for (let y = 5; y <= 7; y += 2) {
        positions.push({ x, y, z: 4 });
      }
    }
    return positions;
  }

  if (type === 'castle') {
    const corners = [
      { cx: 1, cy: 1 },  
      { cx: 10, cy: 1 }, 
      { cx: 1, cy: 10 }, 
      { cx: 10, cy: 10 } 
    ];
    corners.forEach(({ cx, cy }) => {
      for (let dx = 0; dx <= 2; dx += 2) {
        for (let dy = 0; dy <= 2; dy += 2) {
          positions.push({ x: cx + dx, y: cy + dy, z: 0 });
        }
      }
      for (let z = 1; z <= 5; z++) {
        const shift = z % 2 === 1 ? 1 : 0;
        positions.push({ x: cx + shift, y: cy + shift, z });
        positions.push({ x: cx + 2 - shift, y: cy + shift, z });
        positions.push({ x: cx + shift, y: cy + 2 - shift, z });
        positions.push({ x: cx + 2 - shift, y: cy + 2 - shift, z });
      }
    });

    for (let x = 4; x <= 8; x += 2) {
      for (let y = 4; y <= 8; y += 2) {
        positions.push({ x, y, z: 0 });
      }
    }
    for (let x = 5; x <= 7; x += 2) {
      for (let y = 5; y <= 7; y += 2) {
        positions.push({ x, y, z: 1 });
      }
    }
    return positions;
  }

  if (type === 'cross') {
    for (let z = 0; z <= 5; z++) {
      for (let y = 1; y <= 11; y += 2) {
        positions.push({ x: 6 + (z % 2 === 1 ? 1 : 0), y, z });
      }
      for (let x = 1; x <= 11; x += 2) {
        if (x === 5 || x === 7) continue; 
        positions.push({ x, y: 6 + (z % 2 === 1 ? -1 : 0), z });
      }
    }
    positions.push({ x: 1, y: 1, z: 0 });
    positions.push({ x: 11, y: 1, z: 0 });
    positions.push({ x: 1, y: 11, z: 0 });
    positions.push({ x: 11, y: 11, z: 0 });
    return positions;
  }

  // CUSTOM SEEDED LEVEL TEMPLATE BUILDER
  if (type === 'custom' && customSettings) {
    const { layoutTemplate, emojiCount } = customSettings;
    
    // Scale size scaling depending on emoji combinations requested to ensure proper density
    const totalDesireSize = emojiCount * 3 * 3; // e.g. 5 emojis * 3 sets of match-3 = 45 cards

    if (layoutTemplate === 'pyramid') {
      // Procedurally scale a pyramid height based on requested card size
      // Z=0: 6x6, Z=1: 5x5, Z=2: 4x4, Z=3: 3x3, Z=4: 2x2.
      // Append positions up to maximum layers or scale size
      const maxLayers = emojiCount >= 10 ? 6 : emojiCount >= 6 ? 5 : 4;
      for (let z = 0; z < maxLayers; z++) {
        const startX = 1 + z;
        const endX = 11 - z;
        for (let x = startX; x <= endX; x += 2) {
          for (let y = startX; y <= endX; y += 2) {
            positions.push({ x, y, z });
          }
        }
      }
    } 
    else if (layoutTemplate === 'fortress') {
      // 4 towers centered around a defensive grid
      const towers = [
        { cx: 1, cy: 1 }, { cx: 11, cy: 1 },
        { cx: 1, cy: 11 }, { cx: 11, cy: 1 }
      ];

      // Towers are dynamic based on emoji pool size
      const height = emojiCount >= 12 ? 6 : emojiCount >= 7 ? 5 : 4;
      
      towers.forEach(({ cx, cy }) => {
        // Ground plate
        positions.push({ x: cx, y: cy, z: 0 });
        for (let z = 1; z < height; z++) {
          positions.push({ x: cx, y: cy, z });
          positions.push({ x: cx + (z % 2 === 1 ? 1 : -1), y: cy, z });
        }
      });

      // Dense central courtyard connection
      for (let x = 3; x <= 9; x += 2) {
        for (let y = 3; y <= 9; y += 2) {
          positions.push({ x, y, z: 0 });
          positions.push({ x: x + 1, y: y + 1, z: 1 });
        }
      }
    } 
    else { // 'grid' template - heavily stacked dense central brick wall
      const layers = emojiCount >= 10 ? 5 : 4;
      for (let z = 0; z < layers; z++) {
        // Offset coords per level for deep interleaving
        const offset = z % 2 === 1 ? 1 : 0;
        for (let x = 2; x <= 10; x += 2) {
          for (let y = 2; y <= 10; y += 2) {
            positions.push({ x: x + offset, y: y + offset, z });
          }
        }
      }
    }
  }

  // Backup fallback placeholder
  if (positions.length === 0) {
    for (let x = 2; x <= 10; x += 2) {
      for (let y = 2; y <= 10; y += 2) {
        positions.push({ x, y, z: 0 });
      }
    }
  }

  return positions;
}

/**
 * Dynamically computes whether tile A is locked.
 * Overlap condition:
 * A tile spans 2x2 grid spaces.
 * Tile A is locked if there exists another tile B such that:
 * - B.z > A.z
 * - Overlap on grid: Math.abs(A.x - B.x) < 2 AND Math.abs(A.y - B.y) < 2
 *
 * @param tiles List of all active tiles currently on the board
 */
export function recalculateLocks(tiles: Tile[]): Tile[] {
  return tiles.map((tileA) => {
    // Find if there is any tile B on a higher layer (z) that intersects in X,Y coordinates
    const isLocked = tiles.some((tileB) => {
      if (tileB.z <= tileA.z) return false;
      const xOverlap = Math.abs(tileA.x - tileB.x) < 2;
      const yOverlap = Math.abs(tileA.y - tileB.y) < 2;
      return xOverlap && yOverlap;
    });

    return {
      ...tileA,
      isLocked,
    };
  });
}

/**
 * Generates the full set of tile objects for a selected level configuration.
 * Fully supports SEEDED randomness to guarantee deterministic board placement.
 * Ensures the count of EACH selected emoji shape is exactly a multiple of 3.
 */
export function generateLevelTiles(
  type: LevelType, 
  seed: number = Math.floor(Math.random() * 1000000),
  customSettings?: CustomLevelSettings
): Tile[] {
  const config = LEVEL_DEFS[type];
  const rawPositions = generateRawPositions(type, customSettings);

  // 1. Force the total tile count to be a multiple of 3 by pruning surplus positions
  const count = rawPositions.length;
  
  // Decide how many card sets we can support based on available positions
  // In custom mode, clamp numbers to user requested sizes
  let idealCount = Math.floor(count / 3) * 3;
  if (type === 'custom' && customSettings) {
    const requestedMaxCount = customSettings.emojiCount * 3 * 3; // e.g. 8 emojis * 9 = 72 cards
    idealCount = Math.min(idealCount, requestedMaxCount);
    // Ensure it divides by 3
    idealCount = Math.floor(idealCount / 3) * 3;
  }

  // Deterministically shuffle raw positions using SEED
  const shuffledPositions = seededShuffle(rawPositions, seed).slice(0, idealCount);

  // Sort them so they layout properly in 3D (lower Z first so they are placed below in DOM if needed)
  shuffledPositions.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // 2. Select Emoji list and construct pairs of 3
  let availableEmojis = config.emojis;
  if (type === 'custom' && customSettings) {
    // Collect exactly `emojiCount` unique emojis from EMOJI_POOL deterministically using SEED
    const shuffledPool = seededShuffle([...EMOJI_POOL], seed + 99);
    availableEmojis = shuffledPool.slice(0, customSettings.emojiCount);
  }

  const numGroups = idealCount / 3;

  const selectedEmojis: string[] = [];
  for (let i = 0; i < numGroups; i++) {
    const emoji = availableEmojis[i % availableEmojis.length];
    selectedEmojis.push(emoji, emoji, emoji);
  }

  // 3. Shuffle the actual emojis so they are scattered completely randomly across the layout, using SEED
  const shuffledEmojis = seededShuffle(selectedEmojis, seed + 1024);

  // 4. Match shuffled emojis to 3D positions to create our Tile objects
  const initialTiles: Tile[] = shuffledPositions.map((pos, index) => {
    const emoji = shuffledEmojis[index];
    return {
      id: `${type}-${index}-${pos.x}x${pos.y}z${pos.z}-${Math.floor(seed).toString()}`,
      emoji,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      isLocked: false, // Calculated dynamically
    };
  });

  // Calculate locks initially
  return recalculateLocks(initialTiles);
}
