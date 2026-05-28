/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile } from '../types';

interface SlotBarProps {
  slots: Tile[];
}

export const SlotBar: React.FC<SlotBarProps> = ({ slots }) => {
  const MAX_SLOTS = 7;
  
  // Creates an array of 7 items representing each slot space
  const displaySlots = Array.from({ length: MAX_SLOTS }, (_, idx) => slots[idx] || null);

  const getCardBg = (emoji: string) => {
    if (emoji === '🐑') return 'from-amber-50 to-emerald-50 border-emerald-200';
    if (['🥕', '🍎', '🍓', '🍒', '🍋'].includes(emoji)) return 'from-orange-50 to-rose-50 border-rose-200';
    if (['🌲', '🌾', '🪵', '🥬', '🌽'].includes(emoji)) return 'from-emerald-50 to-teal-50 border-emerald-200';
    if (['🥛', '🔔', '🥚'].includes(emoji)) return 'from-slate-50 to-blue-50 border-blue-200';
    return 'from-amber-50 to-orange-50 border-amber-200';
  };

  const getTileShadowColor = (emoji: string) => {
    if (emoji === '🐑') return '#10b981';
    if (['🥕', '🍎', '🍓', '🍒'].includes(emoji)) return '#f43f5e';
    if (['🌲', '🌾', '🪵', '🥬'].includes(emoji)) return '#059669';
    if (['🥛', '🔔', '🥚'].includes(emoji)) return '#3b82f6';
    return '#d97706';
  };

  const slotsCount = slots.length;
  const isAlarm = slotsCount >= 5; // Highlight slot container if close to fuller state

  return (
    <div className="w-full max-w-[420px] mx-auto mt-6">
      <div className="flex justify-between items-center mb-2 px-1 text-xs">
        <span className="text-emerald-300 font-sans font-medium flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
          收集槽 ({slotsCount}/{MAX_SLOTS})
        </span>
        <span className="text-slate-400 font-mono">
          {slotsCount === MAX_SLOTS ? '🤯 槽位已滿，點擊道具自救！' : slotsCount >= 5 ? '⚠️ 警戒！即將塞滿！' : '集滿 3 個自動消除'}
        </span>
      </div>

      {/* Main Bar Platform */}
      <div 
        className={`
          w-full bg-slate-900/80 p-3 rounded-2xl border-2 flex gap-1.5 justify-between items-center shadow-2xl relative transition-colors duration-300
          ${isAlarm ? 'border-rose-950/60 shadow-rose-950/20' : 'border-slate-800'}
        `}
      >
        <div className="absolute inset-0 rounded-2xl bg-radial from-slate-950/10 to-slate-950/50 pointer-events-none" />

        {displaySlots.map((tile, idx) => {
          return (
            <div
              key={tile ? tile.id : `empty-${idx}`}
              className={`
                aspect-square flex-1 rounded-xl flex items-center justify-center relative transition-all duration-300
                ${tile 
                  ? 'bg-transparent' 
                  : 'bg-slate-950/45 border border-dashed border-slate-800/80 shadow-inner'
                }
              `}
              style={{ minHeight: '44px' }}
            >
              {/* If empty grid space, render a faint background sheep head or placeholder */}
              {!tile && (
                <div className="absolute text-[10px] sm:text-xs text-slate-800/40 select-none font-bold">
                  {idx + 1}
                </div>
              )}

              {/* Slate active matching-tile */}
              <AnimatePresence mode="popLayout">
                {tile && (
                  <motion.div
                    key={tile.id}
                    initial={{ scale: 0.5, y: -25, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      y: 0, 
                      opacity: 1,
                      transition: { type: 'spring', stiffness: 350, damping: 25 }
                    }}
                    exit={{ 
                      scale: 0.1, 
                      opacity: 0,
                      transition: { duration: 0.15 }
                    }}
                    layoutId={`board-tile-${tile.id}`}
                    className={`
                      w-full h-full rounded-lg border flex items-center justify-center bg-gradient-to-b relative select-none shadow-md
                      ${getCardBg(tile.emoji)}
                    `}
                    style={{
                      boxShadow: `0 3px 0 0 ${getTileShadowColor(tile.emoji)}, 0 4px 6px rgba(0, 0, 0, 0.15)`,
                      touchAction: 'none'
                    }}
                  >
                    <div className="absolute inset-0 rounded-lg border border-white/25 pointer-events-none" />
                    
                    {/* Glowing effect inside card */}
                    <span className="text-xl sm:text-2xl filter drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.1)] select-none">
                      {tile.emoji}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
