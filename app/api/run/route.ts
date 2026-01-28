import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'

interface RunPayload {
  playerName: string
  score: number
  levelReached: number
  kills: number
  durationSec: number
  seed: string
  items: Array<{ id: string; name: string }>
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RunPayload

    if (!payload?.playerName || !payload.seed) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await sql`
      INSERT INTO runs (player_name, score, level_reached, kills, duration_sec, seed, items)
      VALUES (
        ${payload.playerName},
        ${payload.score},
        ${payload.levelReached},
        ${payload.kills},
        ${payload.durationSec},
        ${payload.seed},
        ${JSON.stringify(payload.items)}
      )
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save run' }, { status: 500 })
  }
}
