/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LevelType, LevelConfig, CustomLevelSettings } from '../types';
import { LEVEL_DEFS } from '../utils/levels';
import { Trophy, HelpCircle, Flame, CheckCircle, Shuffle, Layers, Palette, Grid } from 'lucide-react';
import { cookieHelper } from '../utils/cookies';

interface LevelSelectorProps {
  currentLevel: LevelType;
  onSelectLevel: (level: LevelType) => void;
  onOpenHelp: () => void;
  scoreWins: number;
  scorePlayed: number;
  currentSeed: number;
  customSettings: CustomLevelSettings;
  onChangeCustomSettings: (settings: CustomLevelSettings) => void;
  onRollRandomSeed: () => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  onSelectLevel,
  onOpenHelp,
  scoreWins,
  scorePlayed,
  currentSeed,
  customSettings,
  onChangeCustomSettings,
  onRollRandomSeed
}) => {
  const getDifficultyColor = (difficulty: LevelConfig['difficulty']) => {
    switch (difficulty) {
      case '簡單': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case '考驗': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case '困難': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case '地獄': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse';
      case '自訂': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getLevelEmoji = (id: LevelType) => {
    switch (id) {
      case 'tutorial': return '🌱';
      case 'classic': return '🏔️';
      case 'castle': return '🏰';
      case 'cross': return '⚔️';
      case 'custom': return '🧪';
    }
  };

  const winRate = scorePlayed > 0 ? Math.round((scoreWins / scorePlayed) * 100) : 0;

  // Real-time check if this level option + present seed combination is solved (from Cookie)
  const isLevelCompleted = (levelId: LevelType) => {
    return cookieHelper.isPuzzleCompleted(levelId, currentSeed);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 p-6 shadow-xl mb-6 w-full max-w-[420px] mx-auto select-none">
      {/* Mini Stats Banner */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans tracking-wider uppercase">個人戰績 (COOKIE紀錄)</div>
            <div className="text-xs font-bold text-slate-200">
              勝率 <span className="text-amber-400">{winRate}%</span> ({scoreWins}/{scorePlayed} 局)
            </div>
          </div>
        </div>

        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors bg-slate-800/40 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/50 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          玩法指南
        </button>
      </div>

      {/* Grid List of level items */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Flame className="w-3 h-3 text-rose-500" /> 選擇挑戰關卡
        </h3>
        
        {Object.values(LEVEL_DEFS).map((level) => {
          const isSelected = level.id === currentLevel;
          const completedThisCombination = isLevelCompleted(level.id);

          return (
            <div key={level.id} className="space-y-2">
              <motion.button
                onClick={() => onSelectLevel(level.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  w-full text-left p-3 rounded-2.5xl border-2 transition-all duration-200 relative flex items-start gap-3 justify-between cursor-pointer
                  ${isSelected 
                    ? 'bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-slate-100' 
                    : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                  }
                `}
              >
                {/* Left Segment: Icon + Info */}
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-3xl p-1 bg-slate-900/80 rounded-xl border border-slate-850 self-center">
                    {getLevelEmoji(level.id)}
                  </span>
                  
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-200 leading-none">
                        {level.name}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getDifficultyColor(level.difficulty)}`}>
                        {level.difficulty}
                      </span>
                      
                      {/* Cookie clearance check badge! */}
                      {completedThisCombination && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/35 border border-emerald-800/40 rounded-full px-1.5">
                          <CheckCircle className="w-2.5 h-2.5" /> 已破關
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{level.subtitle}</p>
                  </div>
                </div>

                {/* Right Segment: Radio indicator */}
                <div className="h-full flex items-center self-center justify-center">
                  <div 
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-slate-700 bg-transparent'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="level-dot"
                        className="w-1.5 h-1.5 bg-slate-900 rounded-full" 
                      />
                    )}
                  </div>
                </div>

                {/* Selection Border Glow */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-2.5xl border border-emerald-400/20 pointer-events-none" />
                )}
              </motion.button>

              {/* Dynamic Inner Configuration panel for 自訂 (Custom) level setup */}
              <AnimatePresence>
                {isSelected && level.id === 'custom' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs text-slate-300"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                      <span className="font-bold text-slate-200 uppercase tracking-widest text-[10px] flex items-center gap-1.5 text-purple-400">
                        🧪 自訂佈陣配方
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Seed Layout System
                      </span>
                    </div>

                    {/* 1. SEED CONTROLLER */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 flex justify-between">
                        <span>數字種子 (決定卡牌洗牌隨機順序)</span>
                        <span className="font-mono text-purple-300 font-bold"># {currentSeed}</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={customSettings.seed}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            onChangeCustomSettings({ ...customSettings, seed: Math.max(0, val) });
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500/80"
                          placeholder="輸入自訂種子..."
                        />
                        <button
                          onClick={onRollRandomSeed}
                          className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1 hover:shadow-md hover:shadow-purple-950/20 active:scale-95 transition-all text-[11px] font-sans font-bold cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          隨機
                        </button>
                      </div>
                    </div>

                    {/* 2. LAYOUT TEMPLATE SELECTOR */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 block">3D 佈陣形制</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['pyramid', 'fortress', 'grid'] as const).map((t) => {
                          const isSelTemp = customSettings.layoutTemplate === t;
                          const name = t === 'pyramid' ? '埃及塔' : t === 'fortress' ? '四堡壘' : '密集磚';
                          return (
                            <button
                              key={t}
                              onClick={() => onChangeCustomSettings({ ...customSettings, layoutTemplate: t })}
                              className={`
                                py-1.5 rounded-lg border text-center transition-all text-[10px] font-sans font-medium cursor-pointer
                                ${isSelTemp 
                                  ? 'bg-purple-950/20 border-purple-500 text-purple-300 shadow-sm' 
                                  : 'bg-slate-900/50 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                                }
                              `}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. EMOJI KINDS COUNT */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">極性花色種類 (Emoji 種類)</span>
                        <span className="font-mono font-bold text-slate-200 bg-slate-850 px-2 py-0.5 rounded text-[10px]">
                          {customSettings.emojiCount} 種
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={customSettings.emojiCount}
                        onChange={(e) => {
                          onChangeCustomSettings({ ...customSettings, emojiCount: parseInt(e.target.value) });
                        }}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>3 種 (簡單)</span>
                        <span>9 種 (經典)</span>
                        <span>15 種 (極限地獄)</span>
                      </div>
                    </div>
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
