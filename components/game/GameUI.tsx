'use client'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

const colors = {
  panel: 'rgba(10,12,20,0.75)'
}

const textMap = {
  zh: {
    title: '星际裂隙',
    subtitle: 'WASD 移动 · 鼠标瞄准 · 自动开火',
    start: '开始作战',
    pause: '暂停',
    resume: '继续',
    gameOver: '任务失败',
    score: '得分',
    highScore: '最高分',
    time: '时间',
    level: '关卡',
    kills: '击杀',
    items: '装载道具',
    buffs: '临时增益',
    leaderboard: '排行榜',
    name: '代号',
    lang: '语言'
  },
  en: {
    title: 'Stellar Rift',
    subtitle: 'WASD Move · Mouse Aim · Auto Fire',
    start: 'Engage',
    pause: 'Pause',
    resume: 'Resume',
    gameOver: 'Mission Failed',
    score: 'Score',
    highScore: 'High Score',
    time: 'Time',
    level: 'Level',
    kills: 'Kills',
    items: 'Loadout',
    buffs: 'Buffs',
    leaderboard: 'Leaderboard',
    name: 'Callsign',
    lang: 'Lang'
  }
}

export default function GameUI() {
  const [leaderboard, setLeaderboard] = useState<Array<Record<string, unknown>>>([])
  const {
    phase,
    level,
    score,
    highScore,
    kills,
    timeSec,
    language,
    playerName,
    activeItems,
    startGame,
    pauseGame,
    resumeGame,
    setLanguage,
    setPlayerName
  } = useGameStore()

  const text = textMap[language]

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard ?? []))
      .catch(() => setLeaderboard([]))
  }, [phase])

  return (
    <>
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3 rounded-full px-4 py-2" style={{ background: colors.panel }}>
          <span className="text-cyan-300 text-sm uppercase tracking-widest">{text.score}</span>
          <span className="text-white text-xl font-semibold">{score}</span>
          <span className="text-gray-400 text-sm">{text.level}</span>
          <span className="text-white">{level}</span>
          <span className="text-gray-400 text-sm">{text.kills}</span>
          <span className="text-white">{kills}</span>
          <span className="text-gray-400 text-sm">{text.time}</span>
          <span className="text-white">{Math.floor(timeSec)}s</span>
        </div>

        <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ background: colors.panel }}>
          <span className="text-gray-300 text-xs">{text.lang}</span>
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="text-xs text-cyan-200 uppercase"
          >
            {language === 'zh' ? '中文' : 'EN'}
          </button>
          <button
            onClick={phase === 'paused' ? resumeGame : pauseGame}
            className="text-xs text-gray-200"
          >
            {phase === 'paused' ? text.resume : text.pause}
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3 rounded-2xl px-4 py-3" style={{ background: colors.panel }}>
        <div className="text-xs text-gray-300 uppercase">{text.items}</div>
        <div className="flex flex-wrap gap-2 max-w-[300px]">
          {activeItems.filter((item) => item.type === 'permanent').length === 0 && (
            <span className="text-xs text-gray-500">--</span>
          )}
          {activeItems
            .filter((item) => item.type === 'permanent')
            .map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-cyan-400/40 px-2 py-1 text-xs text-cyan-200"
              >
                {item.name[language]}
              </span>
            ))}
        </div>
        <div className="text-xs text-gray-300 uppercase">{text.buffs}</div>
        <div className="flex flex-wrap gap-2 max-w-[300px]">
          {activeItems.filter((item) => item.type === 'buff').length === 0 && (
            <span className="text-xs text-gray-500">--</span>
          )}
          {activeItems
            .filter((item) => item.type === 'buff')
            .map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-amber-400/50 px-2 py-1 text-xs text-amber-200"
              >
                {item.name[language]}
                {item.expiresAt ? ` ${Math.max(0, Math.ceil(item.expiresAt - timeSec))}s` : ''}
              </span>
            ))}
        </div>
      </div>

      {phase === 'menu' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="max-w-lg rounded-2xl border border-cyan-500/30 bg-black/80 p-10 text-center text-white">
            <h1 className="text-5xl font-semibold text-cyan-200">{text.title}</h1>
            <p className="mt-4 text-sm text-gray-300">{text.subtitle}</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <label className="text-xs text-gray-400">{text.name}</label>
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                className="rounded-full border border-cyan-400/30 bg-transparent px-3 py-1 text-sm text-white"
              />
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              {text.highScore}: <span className="text-cyan-300">{highScore}</span>
            </div>
            <button
              onClick={startGame}
              className="mt-6 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-black"
            >
              {text.start}
            </button>
          </div>
        </div>
      )}

      {phase === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 text-white">
          <div className="text-3xl">{text.pause}</div>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="max-w-xl rounded-2xl border border-red-500/30 bg-black/80 p-10 text-white">
            <h2 className="text-4xl font-semibold text-red-300">{text.gameOver}</h2>
            <div className="mt-4 text-lg">
              {text.score}: <span className="text-cyan-300">{score}</span>
            </div>
            <div className="mt-1 text-sm text-gray-400">
              {text.highScore}: <span className="text-cyan-300">{highScore}</span>
            </div>
            <div className="mt-4 text-sm text-gray-300">{text.leaderboard}</div>
            <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-cyan-500/20">
              {leaderboard.length === 0 && (
                <div className="p-3 text-xs text-gray-500">--</div>
              )}
              {leaderboard.slice(0, 6).map((entry, index) => (
                <div key={`${entry['player_name']}-${index}`} className="flex justify-between px-3 py-2 text-xs">
                  <span>{entry['player_name']}</span>
                  <span className="text-cyan-300">{entry['score']}</span>
                </div>
              ))}
            </div>
            <button
              onClick={startGame}
              className="mt-6 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-black"
            >
              {text.start}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
