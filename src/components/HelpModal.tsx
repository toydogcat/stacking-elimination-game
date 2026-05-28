/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Award, Inbox, RefreshCw, Undo2, ArrowUpFromLine } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐑</span>
                <h3 className="text-lg font-bold text-slate-100 font-sans">《羊了個羊》玩法指南</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-100 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
              
              {/* Concept 1 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400">
                  <Award className="w-4 h-4" /> 1. 消除核心規則 (Core Elimination)
                </h4>
                <p className="text-xs text-slate-400 pl-6">
                  點擊桌面上任何的「未鎖定卡牌」，卡牌會落入底部的 7 格收集槽。
                  當收集槽中湊滿 <strong className="text-amber-400">3 張相同圖案</strong> (例如 🥕🥕🥕) 的卡牌時，它們將會自動消除！
                </p>
              </div>

              {/* Concept 2 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider text-amber-500">
                  <ShieldAlert className="w-4 h-4" /> 2. 獨特層級遮擋 (Overlapping & Locks)
                </h4>
                <div className="text-xs text-slate-400 pl-6 space-y-1">
                  <p>
                    卡牌以多層 3D 形制堆疊。如果一張卡牌的上方有其他任何卡牌在空間上重疊，該下方卡牌將會被「解鎖」前的「鎖定」保護鎖住。
                  </p>
                  <p className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 mt-1 flex items-center gap-2">
                    <span className="inline-flex p-1.5 bg-slate-900 rounded-lg text-slate-500 border border-slate-800 text-[10px]">🔒 灰暗卡牌</span>
                    <span>代表下方被遮擋，無法點選，只有移開上方卡牌解鎖，才會恢復彩色！</span>
                  </p>
                </div>
              </div>

              {/* Concept 3 */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider text-sky-400">
                  <Inbox className="w-4 h-4" /> 3. 大師輔助道具 (4 Great Power-Ups)
                </h4>
                <div className="space-y-2.5 pl-2">
                  <div className="flex gap-2.5 items-start">
                    <span className="p-1 px-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 text-[10px] font-bold font-mono">UNDO</span>
                    <div className="text-[11px] leading-tight text-slate-400 mt-0.5">
                      <strong className="text-slate-200 block">撤銷：</strong>
                      將最近點擊移入槽中的 1 張卡牌原路放回棋盤上（含其座標、層級與鎖定狀態）。
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="p-1 px-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 text-[10px] font-bold font-mono">SHIFT</span>
                    <div className="text-[11px] leading-tight text-slate-400 mt-0.5">
                      <strong className="text-slate-200 block">移出暫存：</strong>
                      將槽中前 3 張卡牌移到側邊的臨時暫存區，騰出底部的 7 格槽位空間！
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-[10px] font-bold font-mono">SHUFFLE</span>
                    <div className="text-[11px] leading-tight text-slate-400 mt-0.5">
                      <strong className="text-slate-200 block">洗牌：</strong>
                      將棋盤上所有剩餘的卡牌圖案隨機打亂，但保持它們原有的 3D 位置與遮擋關係不變。
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="p-1 px-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 text-[10px] font-bold font-mono">REVIVE</span>
                    <div className="text-[11px] leading-tight text-slate-400 mt-0.5">
                      <strong className="text-slate-200 block">復活護卡：</strong>
                      當槽位集滿 7 張而宣告失敗時，可免費使用 1 次復活，把 3 張卡牌挪入暫存使遊戲繼續。
                    </div>
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div className="p-3.5 bg-indigo-950/20 hover:bg-indigo-950/30 rounded-2xl border border-indigo-500/20 text-[11px] text-indigo-300">
                💡 <strong>通關秘笈：</strong> 絕對不可盲目點擊！請先觀察好中下層被壓住的牌，優先消去那些擋住最多牌的高層大卡，是通關的最核心訣竅！
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg active:scale-98 text-slate-100 rounded-xl font-bold font-sans transition-all text-xs"
              >
                我知道了，立刻開玩！
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
