/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile, LevelType, GameStats, CustomLevelSettings } from './types';
import { GameBoard } from './components/GameBoard';
import { SlotBar } from './components/SlotBar';
import { LevelSelector } from './components/LevelSelector';
import { HelpModal } from './components/HelpModal';
import { LEVEL_DEFS, generateLevelTiles, recalculateLocks } from './utils/levels';
import { gameAudio } from './utils/audio';
import { verifySolvability, SolveResult } from './utils/solver';
import { cookieHelper } from './utils/cookies';

import { 
  Undo2, 
  RefreshCw, 
  ArrowUpToLine, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Sparkles, 
  Heart, 
  Brain,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Trash2
} from 'lucide-react';

export default function App() {
  // Game Play States
  const [currentLevel, setCurrentLevel] = useState<LevelType>('tutorial');
  const [currentSeed, setCurrentSeed] = useState<number>(101);
  const [boardTiles, setBoardTiles] = useState<Tile[]>([]);
  const [slotTiles, setSlotTiles] = useState<Tile[]>([]);
  const [tempTiles, setTempTiles] = useState<Tile[]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');

  // Custom Seed level layouts settings
  const [customSettings, setCustomSettings] = useState<CustomLevelSettings>({
    seed: 5201314,
    emojiCount: 8,
    layoutTemplate: 'pyramid'
  });

  // Solver Engine States
  const [solverResult, setSolverResult] = useState<SolveResult | null>(null);
  const [hintTileId, setHintTileId] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // Cooldowns and animation lockers
  const [isMatching, setIsMatching] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(gameAudio.isMuted());

  // Power-up Inventory
  const [undoCount, setUndoCount] = useState<number>(3);
  const [shiftCount, setShiftCount] = useState<number>(1);
  const [shuffleCount, setShuffleCount] = useState<number>(3);
  const [hasRevived, setHasRevived] = useState<boolean>(false);

  // Undo and History tracking for state restoration
  const [history, setHistory] = useState<{ boardTiles: Tile[]; slotTiles: Tile[] }[]>([]);

  // Persistent Game Statistics
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    currentStreak: 0
  });

  // Load and cache settings from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('sheepMatchStats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to parse cached stats', e);
      }
    }
    // Setup initial board
    initNewGame('tutorial');
  }, []);

  // Iframe scroll sync for Luna Hub integration
  useEffect(() => {
    let lastScrollY = 0;
    const scrollThreshold = 8; // 靈敏度門檻，防微小抖動
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold && currentScrollY > 10) return;
      
      // 判斷滾動方向
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      
      // 向母窗口廣播滾動狀態
      window.parent.postMessage({
        type: 'iframe_scroll',
        scrollY: currentScrollY,
        direction: direction
      }, '*');
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get fixed seed helper to ensure "同關卡就是固定的排列" (Fixed layouts)
  const getFixedSeedForLevel = (level: LevelType): number => {
    switch (level) {
      case 'tutorial': return 101;
      case 'classic': return 505;
      case 'castle': return 333;
      case 'cross': return 777;
      default: return customSettings.seed;
    }
  };

  // Save Stats Helper with bonus Cookie clearance tagging!
  const updateStatsAndSave = (isWin: boolean, activeLevel = currentLevel, activeSeed = currentSeed) => {
    if (isWin) {
      // Record clearance into cookie securely!
      cookieHelper.markPuzzleAsCompleted(activeLevel, activeSeed);
    }

    setStats((prev) => {
      const updated = {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: isWin ? prev.gamesWon + 1 : prev.gamesWon,
        gamesLost: !isWin ? prev.gamesLost + 1 : prev.gamesLost,
        currentStreak: isWin ? prev.currentStreak + 1 : 0
      };
      localStorage.setItem('sheepMatchStats', JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Initializes a brand new game board with layout positions populated completely.
   */
  const initNewGame = (
    levelType: LevelType = currentLevel, 
    specificSeed?: number, 
    specificSettings?: CustomLevelSettings
  ) => {
    const settings = specificSettings || customSettings;

    // Resolve active seed
    let activeSeed = 101;
    if (levelType === 'custom') {
      activeSeed = specificSeed !== undefined ? specificSeed : settings.seed;
    } else {
      activeSeed = getFixedSeedForLevel(levelType);
    }

    setCurrentSeed(activeSeed);
    
    // Generate tiles deterministically via seed
    const initialTiles = generateLevelTiles(levelType, activeSeed, settings);
    
    setBoardTiles(initialTiles);
    setSlotTiles([]);
    setTempTiles([]);
    setHistory([]);
    setGameStatus('playing');
    setIsMatching(false);
    
    // Clear old solver telemetry to avoid stale guides
    setSolverResult(null);
    setHintTileId(null);
    setIsSolving(false);
    
    // Revitalize helper inventory for a fresh challenge
    setUndoCount(levelType === 'tutorial' ? 5 : 3);
    setShuffleCount(levelType === 'tutorial' ? 5 : 3);
    setShiftCount(1);
    setHasRevived(false);
  };

  // Mute toggle trigger
  const handleToggleMute = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  /**
   * Group new elements of similar emojis next to each other, maintaining insertion sequence.
   */
  const groupAndSortSlots = (arr: Tile[]): Tile[] => {
    const orderMap: string[] = [];
    arr.forEach((tile) => {
      if (!orderMap.includes(tile.emoji)) {
        orderMap.push(tile.emoji);
      }
    });

    return [...arr].sort((a, b) => {
      if (a.emoji !== b.emoji) {
        return orderMap.indexOf(a.emoji) - orderMap.indexOf(b.emoji);
      }
      return 0; // maintain relative click order
    });
  };

  /**
   * Handler when a player clicks a valid tile on the board workspace.
   */
  const handleTileClick = (clickedTile: Tile) => {
    if (gameStatus !== 'playing' || isMatching || clickedTile.isLocked) return;

    // Check bottom slot container availability first
    if (slotTiles.length >= 7) {
      gameAudio.playClickLocked();
      return;
    }

    // Capture state in history prior to updating, to support Undo perfectly
    setHistory((prev) => [...prev, { boardTiles: [...boardTiles], slotTiles: [...slotTiles] }]);

    // Move card from active board to bottom bar slots
    const updatedBoard = boardTiles.filter((t) => t.id !== clickedTile.id);
    const updatedSlots = groupAndSortSlots([...slotTiles, clickedTile]);

    // Clear stale hints
    setHintTileId(null);

    // Fast recalculate lock states for remaining tiles so player gets immediate translucent feedback
    const withUpdatedLocks = recalculateLocks(updatedBoard);
    setBoardTiles(withUpdatedLocks);
    setSlotTiles(updatedSlots);
  };

  /**
   * Dynamic Solvability checking algorithm trigger
   */
  const handleVerifySolvability = () => {
    if (boardTiles.length === 0) return;
    setIsSolving(true);

    // Run verification algorithm asynchronously in microtask to prevent UI stutter/jank
    setTimeout(() => {
      // Find solution pathways from current subset of remaining board cards!
      const result = verifySolvability(boardTiles, 1800);
      setSolverResult(result);
      setIsSolving(false);

      if (result.solvable) {
        gameAudio.playPowerup();
      } else {
        gameAudio.playClickLocked();
      }
    }, 50);
  };

  /**
   * Action trigger for revealing a smart AI Hint
   */
  const handleSuggestHint = () => {
    // If we haven't ran solver yet, or board state changed, solve first
    if (!solverResult) {
      const result = verifySolvability(boardTiles, 1800);
      setSolverResult(result);
      if (result.solvable && result.solvePath && result.solvePath.length > 0) {
        const nextBestId = result.solvePath.find(id => {
          const t = boardTiles.find(tile => tile.id === id);
          return t && !t.isLocked;
        });
        if (nextBestId) {
          setHintTileId(nextBestId);
          gameAudio.playTap();
        }
      } else {
        gameAudio.playClickLocked();
      }
    } else {
      if (solverResult.solvable && solverResult.solvePath && solverResult.solvePath.length > 0) {
        const nextBestId = solverResult.solvePath.find(id => {
          const t = boardTiles.find(tile => tile.id === id);
          return t && !t.isLocked;
        });
        if (nextBestId) {
          setHintTileId(nextBestId);
          gameAudio.playTap();
        } else {
          // No playable card found on board currently (might be locked by other moves)
          // Run a fresh, mid-game recalculation
          const freshRes = verifySolvability(boardTiles, 1800);
          setSolverResult(freshRes);
          const recalculatingId = freshRes.solvePath?.find(id => {
            const t = boardTiles.find(tile => tile.id === id);
            return t && !t.isLocked;
          });
          if (recalculatingId) {
            setHintTileId(recalculatingId);
            gameAudio.playTap();
          } else {
            gameAudio.playClickLocked();
          }
        }
      } else {
        gameAudio.playClickLocked();
      }
    }
  };

  /**
   * Trigger matched check every time the slot selection is modified
   */
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    // Clear matching results on tile adjustments to trigger fresh solving if requested
    setSolverResult(null);

    // Check if slot tiles have 3 occurrences of any emoji
    const counts: Record<string, number> = {};
    slotTiles.forEach((tile) => {
      counts[tile.emoji] = (counts[tile.emoji] || 0) + 1;
    });

    // Find the symbol that occurred 3 times which needs removal
    const matchEmoji = Object.keys(counts).find((emoji) => counts[emoji] >= 3);

    if (matchEmoji) {
      setIsMatching(true);
      
      // Delay slightly (150ms-240ms) giving nice gravity visualization
      const timeoutId = setTimeout(() => {
        // Play chiming audio synthesis
        gameAudio.playMatch();

        setSlotTiles((prev) => {
          // Filter out the first 3 cards of this emoji
          let filterCount = 0;
          return prev.filter((tile) => {
            if (tile.emoji === matchEmoji && filterCount < 3) {
              filterCount++;
              return false; // exclude this matching card
            }
            return true;
          });
        });

        setIsMatching(false);
      }, 200);

      return () => clearTimeout(timeoutId);
    }

    // If slots are completely full and no match was found, failure happens
    if (slotTiles.length === 7 && !isMatching) {
      // Game Over: Failure
      setGameStatus('lost');
      gameAudio.playLose();
      updateStatsAndSave(false);
    }

    // Win condition check: if all arrays are completely empty
    if (boardTiles.length === 0 && slotTiles.length === 0 && tempTiles.length === 0 && !isMatching) {
      setGameStatus('won');
      gameAudio.playWin();
      updateStatsAndSave(true);
    }

  }, [slotTiles, boardTiles, tempTiles, gameStatus, isMatching]);

  /**
   * POWER-UP 1: Undo (撤銷最近一步)
   */
  const handleUndo = () => {
    if (gameStatus !== 'playing' || isMatching || undoCount <= 0 || history.length === 0) {
      gameAudio.playClickLocked();
      return;
    }

    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setBoardTiles(recalculateLocks(previousState.boardTiles));
    setSlotTiles(previousState.slotTiles);
    setUndoCount((prev) => prev - 1);
    setHintTileId(null);
    gameAudio.playTap();
  };

  /**
   * POWER-UP 2: Shift Out (移出前 3 張暫存)
   */
  const handleShiftOut = () => {
    if (gameStatus !== 'playing' || isMatching || shiftCount <= 0 || slotTiles.length === 0) {
      gameAudio.playClickLocked();
      return;
    }

    // Move first 3 items (or fewer if length is less) of slots to the temporary buffer tray
    const moveCount = Math.min(3, slotTiles.length);
    const toShift = slotTiles.slice(0, moveCount);
    const remainingSlots = slotTiles.slice(moveCount);

    setTempTiles((prev) => [...prev, ...toShift]);
    setSlotTiles(remainingSlots);
    setShiftCount((prev) => prev - 1);
    setHintTileId(null);
    gameAudio.playPowerup();
  };

  /**
   * Click a temporary tray card to send it back into bottom slots
   */
  const handleTempTileClick = (tempTile: Tile) => {
    if (gameStatus !== 'playing' || isMatching || slotTiles.length >= 7) {
      gameAudio.playClickLocked();
      return;
    }

    // Remove from temp tray and push to slots
    setTempTiles((prev) => prev.filter((t) => t.id !== tempTile.id));
    setSlotTiles((prev) => groupAndSortSlots([...prev, tempTile]));
    setHintTileId(null);
    gameAudio.playTap();
  };

  /**
   * POWER-UP 3: Shuffle (隨機混亂在場卡牌)
   */
  const handleShuffle = () => {
    if (gameStatus !== 'playing' || isMatching || shuffleCount <= 0 || boardTiles.length <= 1) {
      gameAudio.playClickLocked();
      return;
    }

    // Harvest all current active emojis on the board
    const remainingEmojis = boardTiles.map((t) => t.emoji);

    // Shuffle them completely
    const shuffledEmojis = [...remainingEmojis].sort(() => Math.random() - 0.5);

    // Assign back to positions
    const updatedTiles = boardTiles.map((tile, idx) => ({
      ...tile,
      emoji: shuffledEmojis[idx],
    }));

    setBoardTiles(recalculateLocks(updatedTiles));
    setShuffleCount((prev) => prev - 1);
    setHintTileId(null);
    gameAudio.playShuffle();
  };

  /**
   * POWER-UP 4: Revive (滿槽復活救回一命)
   */
  const handleRevive = () => {
    if (hasRevived || slotTiles.length < 3) {
      gameAudio.playClickLocked();
      return;
    }

    // Move 3 items out to temp slot instantly and change state to playing
    const toShift = slotTiles.slice(0, 3);
    const remaining = slotTiles.slice(3);

    setTempTiles((prev) => [...prev, ...toShift]);
    setSlotTiles(remaining);
    setHasRevived(true);
    setGameStatus('playing');
    setHintTileId(null);
    gameAudio.playPowerup();
  };

  const handleSelectLevel = (levelType: LevelType) => {
    setCurrentLevel(levelType);
    initNewGame(levelType);
  };

  const handleCustomSettingsChange = (newSettings: CustomLevelSettings) => {
    setCustomSettings(newSettings);
    // Auto re-init if they are viewing the custom levels
    if (currentLevel === 'custom') {
      initNewGame('custom', newSettings.seed, newSettings);
    }
  };

  const handleRollRandomSeed = () => {
    const rolled = Math.floor(Math.random() * 9000000) + 100000;
    const updated = { ...customSettings, seed: rolled };
    setCustomSettings(updated);
    if (currentLevel === 'custom') {
      initNewGame('custom', rolled, updated);
    }
    gameAudio.playShuffle();
  };

  const handleClearCookies = () => {
    if (window.confirm("確定要清除所有 Cookie 中的破關紀錄嗎？這將會重置所有關卡的『已破關』標章。")) {
      cookieHelper.clearAllRecords();
      gameAudio.playLose();
      alert("已清除！");
      // Force reload layout states
      initNewGame();
    }
  };

  return (
    <div className="bg-radial from-slate-900 via-emerald-950 to-slate-950 min-h-screen text-slate-100 flex flex-col items-center justify-between p-4 md:p-6 font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Decorative Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* header container row */}
      <header className="w-full max-w-[420px] mx-auto flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg border border-emerald-400/30 animate-bounce-subtle">
            <span className="text-2xl filter drop-shadow-md select-none">🐑</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white font-sans flex items-center gap-1">
              羊了個羊 <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-normal px-1.5 py-0.5 rounded-md border border-emerald-500/20">種子配方版</span>
            </h1>
            <p className="text-[9px] text-emerald-400/80 uppercase tracking-widest font-mono">
              Deterministic Seed Engine
            </p>
          </div>
        </div>

        {/* Audio Volume Button Toggle and cookie cleaners */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearCookies}
            title="清空破關 Cookie 紀錄"
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-center shadow-md pr-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-center shadow-md justify-items-center"
            title={isMuted ? "取消靜音" : "靜音聲效"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Column Core Grid Workspace Layout */}
      <main className="w-full flex-grow flex flex-col justify-center items-center z-10 py-3 gap-1">
        
        {/* Quick Progress Banner */}
        <div className="w-full max-w-[420px] flex justify-between items-center mb-1 bg-slate-950/45 border border-slate-800/80 py-2.5 px-3.5 rounded-2xl shadow-xl backdrop-blur-xs select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">當前關卡:</span>
            <span className="text-xs font-black text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 flex items-center gap-1">
              {LEVEL_DEFS[currentLevel].name}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              #{currentSeed}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              剩餘卡牌: <span className="font-bold font-mono text-slate-100">{boardTiles.length}</span>
            </span>

            <button
              onClick={() => initNewGame()}
              className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-sans flex items-center gap-1 border border-slate-700/60 cursor-pointer"
              title="以當前固定種子重新佈陣"
            >
              <RotateCcw className="w-3 h-3" />
              重來
            </button>
          </div>
        </div>

        {/* 1. Main Tabletop 3D Board (Passed hint tile support!) */}
        <GameBoard tiles={boardTiles} onTileClick={handleTileClick} hintTileId={hintTileId} />

        {/* 2. AI Solvability & Validation HUD Dashboard */}
        <div className="w-full max-w-[420px] mx-auto mt-3.5 bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2.5xl backdrop-blur-md text-xs space-y-2.5 shadow-xl select-none">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200 uppercase tracking-widest text-[10px] flex items-center gap-1 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" /> AI 棋局驗證中心
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              DFS Solvability Engine
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleVerifySolvability}
              disabled={isSolving || boardTiles.length === 0}
              className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-slate-850 hover:border-slate-700 hover:text-white active:scale-95 transition-all text-[11px] cursor-pointer"
            >
              <Brain className={`w-3.5 h-3.5 text-blue-400 ${isSolving && 'animate-spin'}`} />
              {isSolving ? '深度計算中...' : '驗證是否有解'}
            </button>

            <button
              onClick={handleSuggestHint}
              disabled={boardTiles.length === 0}
              className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-slate-850 hover:border-slate-700 hover:text-white active:scale-95 transition-all text-[11px] cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              智慧提示下一步
            </button>
          </div>

          {/* Verification result output */}
          {solverResult && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                solverResult.solvable
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                  : solverResult.uncertain
                    ? 'bg-purple-950/25 border-purple-500/20 text-purple-300'
                    : 'bg-rose-950/25 border-rose-500/20 text-rose-300'
              }`}
            >
              {solverResult.solvable ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${solverResult.uncertain ? 'text-purple-400' : 'text-rose-400'}`} />
              )}
              <div className="text-[11px] leading-relaxed">
                {solverResult.solvable ? (
                  <>
                    <strong>AI 探測報告：本篇有完美解！</strong> 棋局結構絕對成立，請按「智慧提示」照著金色高亮卡牌消除即可破關。(探測總深: {solverResult.stepsChecked} 步)
                  </>
                ) : solverResult.uncertain ? (
                  <>
                    <strong>AI 探測報告：極高難度地獄格局！</strong> AI 搜索了 {solverResult.stepsChecked} 步尚未得出 100% 成立解法。快展現你的超凡智慧，打破極限吧！
                  </>
                ) : (
                  <>
                    <strong>AI 探測報告：當前狀態已陷死局！</strong> 當前所做選擇或初始佈局不支援全消，建議使用「撤銷」回推或點擊「重來」重新開始本局。
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* 3. Temporary storage box tray (shifted out by shift power-up) */}
        {tempTiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[420px] mx-auto mt-4"
          >
            <div className="text-[10px] text-slate-400 mb-1 px-1 flex justify-between">
              <span className="flex items-center gap-1 text-slate-300">
                📥 暫存輔助欄 ({tempTiles.length}/3)
              </span>
              <span>點點卡牌，點擊召回底槽！</span>
            </div>
            
            <div className="bg-emerald-950/25 border border-emerald-800/30 p-2 rounded-2xl flex gap-2 justify-center items-center shadow-lg min-h-[58px]">
              {tempTiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  onClick={() => handleTempTileClick(tile)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-b from-amber-50 to-orange-100 text-slate-800 border-2 border-orange-200 h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer shadow-md text-lg hover:-translate-y-0.5 transition-transform"
                  style={{
                    boxShadow: '0 2.5px 0 0 #d97706, 0 4px 6px rgba(0,0,0,0.15)',
                    touchAction: 'none'
                  }}
                >
                  {tile.emoji}
                </motion.div>
              ))}
              
              {/* Dash empty placeholders inside tray */}
              {Array.from({ length: Math.max(0, 3 - tempTiles.length) }).map((_, idx) => (
                <div key={`empty-temp-${idx}`} className="h-10 w-10 rounded-xl border border-dashed border-emerald-800/30 bg-slate-900/10 flex items-center justify-center font-mono text-[9px] text-emerald-800/20">
                  +
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 4. Slot collector tray */}
        <SlotBar slots={slotTiles} />

        {/* 5. Power up action triggers */}
        <div className="w-full max-w-[420px] mx-auto grid grid-cols-3 gap-2 px-0.5 mt-5 select-none">
          {/* Helper 1: Undo (撤銷) */}
          <button
            onClick={handleUndo}
            disabled={undoCount <= 0 || history.length === 0}
            className={`
              py-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 shadow-md relative
              ${undoCount > 0 && history.length > 0
                ? 'bg-slate-900/80 border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 cursor-pointer active:scale-95'
                : 'bg-slate-950/30 border-slate-900/60 text-slate-600 cursor-not-allowed'
              }
            `}
          >
            <Undo2 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-sans font-medium">撤銷上一步</span>
            <span className={`
              absolute -top-1.5 -right-1 text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border
              ${undoCount > 0 ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-800 text-slate-500 border-slate-700'}
            `}>
              {undoCount}
            </span>
          </button>

          {/* Helper 2: Shift Out (移出暫存) */}
          <button
            onClick={handleShiftOut}
            disabled={shiftCount <= 0 || slotTiles.length === 0}
            className={`
              py-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 shadow-md relative
              ${shiftCount > 0 && slotTiles.length > 0
                ? 'bg-slate-900/80 border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 cursor-pointer active:scale-95'
                : 'bg-slate-950/30 border-slate-900/60 text-slate-600 cursor-not-allowed'
              }
            `}
          >
            <ArrowUpToLine className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-sans font-medium">移出三張牌</span>
            <span className={`
              absolute -top-1.5 -right-1 text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border
              ${shiftCount > 0 ? 'bg-indigo-500 text-white border-indigo-300' : 'bg-slate-800 text-slate-500 border-slate-700'}
            `}>
              {shiftCount}
            </span>
          </button>

          {/* Helper 3: Shuffle (重新洗牌) */}
          <button
            onClick={handleShuffle}
            disabled={shuffleCount <= 0 || boardTiles.length <= 1}
            className={`
              py-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 shadow-md relative
              ${shuffleCount > 0 && boardTiles.length > 1
                ? 'bg-slate-900/80 border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 cursor-pointer active:scale-95'
                : 'bg-slate-950/30 border-slate-900/60 text-slate-600 cursor-not-allowed'
              }
            `}
          >
            <RefreshCw className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-sans font-medium">洗牌亂棋局</span>
            <span className={`
              absolute -top-1.5 -right-1 text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border
              ${shuffleCount > 0 ? 'bg-emerald-500 text-slate-950 border-emerald-300' : 'bg-slate-800 text-slate-500 border-slate-700'}
            `}>
              {shuffleCount}
            </span>
          </button>
        </div>

      </main>

      {/* Level Selection Control Panel Module */}
      <section className="w-full z-10">
        <LevelSelector 
          currentLevel={currentLevel} 
          onSelectLevel={handleSelectLevel} 
          onOpenHelp={() => setIsHelpOpen(true)}
          scoreWins={stats.gamesWon}
          scorePlayed={stats.gamesPlayed}
          currentSeed={currentSeed}
          customSettings={customSettings}
          onChangeCustomSettings={handleCustomSettingsChange}
          onRollRandomSeed={handleRollRandomSeed}
        />
      </section>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-slate-500 font-sans mt-3 select-none py-1">
        🐑 羊了個羊 種子密碼版 • 支援 Cookie 破關標章 • Web Audio 音效技術
      </footer>

      {/* 6. Rule Help Overlay Dialog Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 7. GAME OVER POPUP MODALS (GLASSMORPHISM) */}
      <AnimatePresence>
        {gameStatus === 'won' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-emerald-500/40 p-8 rounded-3xl w-full max-w-sm text-center relative z-10 shadow-2xl"
            >
              {/* Glorious Win Fireworks Sparkle Icons */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 w-24 h-24 rounded-full border-4 border-slate-900 flex items-center justify-center text-5xl shadow-xl">
                🏆
              </div>

              <div className="pt-10">
                <span className="text-xs font-bold font-mono tracking-widest text-emerald-400 uppercase">
                  CONGRATULATIONS
                </span>
                <h2 className="text-2xl font-black text-slate-100 mt-1 mb-2 font-sans">
                  你成功加入羊群！
                </h2>
                
                {/* Win Statistics Streak */}
                <div className="bg-emerald-950/40 border border-emerald-800/40 p-3.5 rounded-2xl flex justify-around my-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">累計通關</span>
                    <strong className="text-lg text-emerald-400 font-mono">{stats.gamesWon}</strong>
                  </div>
                  <div className="border-r border-emerald-800/20" />
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">當前連勝</span>
                    <strong className="text-lg text-amber-400 font-mono">{stats.currentStreak} 🔥</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  太神了！你解開了 <strong className="text-amber-200">{LEVEL_DEFS[currentLevel].name}</strong> (種子 #{currentSeed})！此破關成就已成功永久記錄於你的 Cookie 瀏覽器憑證中。
                </p>

                {/* Next steps buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => initNewGame()}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-900/20 text-slate-950 font-bold font-sans rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer text-slate-900"
                  >
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    再挑戰一局！
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {gameStatus === 'lost' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-rose-500/30 p-8 rounded-3xl w-full max-w-sm text-center relative z-10 shadow-2xl"
            >
              {/* Grave or Lost state */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-300 w-24 h-24 rounded-full border-4 border-slate-900 flex items-center justify-center text-5xl shadow-xl">
                🪦
              </div>

              <div className="pt-10">
                <span className="text-xs font-bold font-mono tracking-widest text-rose-400 uppercase">
                  GAME OVER
                </span>
                <h2 className="text-2xl font-black text-slate-100 mt-1 mb-2 font-sans">
                  收集槽已被填滿！
                </h2>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  槽位塞滿了。如果你卡關了，可以隨時啟用「AI 智慧提示」來指導你點按可行走步驟！
                </p>

                {/* Revive options vs Restart */}
                <div className="flex flex-col gap-2.5">
                  {/* Revive Button (Only if didn't revive yet and we can afford) */}
                  {!hasRevived && slotTiles.length >= 3 ? (
                    <button
                      onClick={handleRevive}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 hover:shadow-lg text-slate-950 font-bold font-sans rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer text-slate-900"
                    >
                      <Heart className="w-4 h-4 fill-slate-900 text-slate-900" />
                      復活！移走槽中 3 張牌 (僅限一次)
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-500 bg-slate-950/40 p-2 rounded-xl mb-1">
                      {hasRevived ? "❌ 本局已使用過復活道具" : "❌ 槽位圖案剩餘少於 3 張，無法復活"}
                    </div>
                  )}

                  <button
                    onClick={() => initNewGame()}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-705 text-slate-300 font-bold font-sans rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新再戰
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
