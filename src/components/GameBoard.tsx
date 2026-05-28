/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile } from '../types';
import { Lock } from 'lucide-react';
import { gameAudio } from '../utils/audio';

interface GameBoardProps {
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
  hintTileId?: string | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({ tiles, onTileClick, hintTileId }) => {
  // Total division of grid. Coordinates go up to 14.
  const GRID_SIZE = 14;

  const handleTilePress = (tile: Tile) => {
    if (tile.isLocked) {
      gameAudio.playClickLocked();
      return;
    }
    gameAudio.playTap();
    onTileClick(tile);
  };

  // Helper colors for tiles to create variety & beautiful game card aesthetics
  const getCardBg = (emoji: string) => {
    // Elegant warm tones based on emoji themes
    if (emoji === '🐑') return 'from-amber-50 to-emerald-50 border-emerald-200 hover:border-emerald-400';
    if (['🥕', '🍎', '🍓', '🍒', '🍋'].includes(emoji)) return 'from-orange-50 to-rose-50 border-rose-200 hover:border-rose-400';
    if (['🌲', '🌾', '🪵', '🥬', '🌽'].includes(emoji)) return 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400';
    if (['🥛', '🔔', '🥚'].includes(emoji)) return 'from-slate-50 to-blue-50 border-blue-200 hover:border-blue-400';
    return 'from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400';
  };

  const getTileShadowColor = (emoji: string) => {
    if (emoji === '🐑') return '#10b981'; // Emerald edge
    if (['🥕', '🍎', '🍓', '🍒'].includes(emoji)) return '#f43f5e'; // Rose edge
    if (['🌲', '🌾', '🪵', '🥬'].includes(emoji)) return '#059669'; // Forest green edge
    if (['🥛', '🔔', '🥚'].includes(emoji)) return '#3b82f6'; // Blue edge
    return '#d97706'; // Amber edge
  };

  return (
    <div 
      className="relative w-full aspect-square max-w-[420px] mx-auto bg-emerald-950/45 rounded-3xl border-4 border-emerald-800/60 p-4 shadow-inner overflow-hidden tile-grid-pattern"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Empty board placeholder */}
      {tiles.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-emerald-950/30 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h3 className="text-xl font-bold text-amber-200 font-sans">大吉大利，全數消除！</h3>
          <p className="text-xs text-emerald-300 mt-1 max-w-[200px]">你實在是太優秀了！快點擊按鈕重置挑戰吧！</p>
        </div>
      )}

      {/* Rendering stack of active cards */}
      <AnimatePresence>
        {tiles.map((tile) => {
          const widthPercent = (2 / GRID_SIZE) * 100;
          const heightPercent = (2 / GRID_SIZE) * 100;
          const leftPercent = (tile.x / GRID_SIZE) * 100;
          const topPercent = (tile.y / GRID_SIZE) * 100;

          // Compute a slightly offset shadow style to represent elevated 3D depth based on layers
          const zOffsetIndex = tile.z; // 0, 1, 2, ...
          const bgClassName = getCardBg(tile.emoji);
          const shadowColor = getTileShadowColor(tile.emoji);

          return (
            <motion.div
              key={tile.id}
              initial={{ scale: 0.2, opacity: 0, y: -20 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                transition: { type: 'spring', stiffness: 260, damping: 20 }
              }}
              exit={{ 
                scale: 0.5, 
                opacity: 0, 
                y: 40,
                transition: { duration: 0.15, ease: 'easeIn' }
              }}
              layoutId={`board-tile-${tile.id}`}
              className="absolute select-none"
              style={{
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                zIndex: tile.z + 10, // Ensure stacked cards have higher native z-index
                touchAction: 'none',
              }}
            >
              <div
                id={`tile-${tile.id}`}
                onClick={() => handleTilePress(tile)}
                className={`
                  w-full h-full rounded-xl border flex items-center justify-center bg-gradient-to-b relative transition-all duration-150
                  ${bgClassName} 
                  ${tile.isLocked 
                    ? 'locked opacity-50 brightness-40 saturate-[30%] pointer-events-none' 
                    : 'cursor-pointer group active:scale-95 shadow-md hover:scale-105 active:translate-y-1'
                  }
                  tile-inner
                `}
                style={{
                  // Pass theme shadow color as inline CSS variable for the custom 3D card visual bevel
                  '--tile-shadow-color': tile.isLocked ? '#475569' : shadowColor,
                  // Tilted look slightly based on layer level
                  transform: tile.isLocked 
                    ? `translateY(-${zOffsetIndex * 2}px)`
                    : `translateY(-${zOffsetIndex * 4.5}px) scale(0.98)`,
                  transformOrigin: 'center center',
                } as React.CSSProperties}
              >
                {/* Visual indicator of 3D layered lines around card */}
                <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" />

                {/* Highlight Hint Pulsing Ring */}
                {tile.id === hintTileId && (
                  <div className="absolute -inset-0.5 rounded-xl border-3 border-amber-400 animate-pulse bg-amber-400/20 shadow-[0_0_12px_#fbbf24] pointer-events-none z-50" />
                )}

                {/* Card Emoji */}
                <span 
                  className={`
                    text-2xl sm:text-3xl md:text-4xl filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] select-none
                    ${!tile.isLocked && 'group-hover:scale-115 transition-transform duration-150'}
                  `}
                >
                  {tile.emoji}
                </span>

                {/* Layer Number indicator on the card corner for accessibility / neat aesthetics */}
                <div className="absolute top-1 left-1.5 text-[8px] font-mono opacity-30 select-none text-slate-800">
                  L{tile.z + 1}
                </div>

                {/* Padlock Icon overlay for locked state */}
                {tile.isLocked && (
                  <div className="absolute bottom-1 right-1 bg-slate-900/80 p-0.5 rounded-full text-slate-300">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
