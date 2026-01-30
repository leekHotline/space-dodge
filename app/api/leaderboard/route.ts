import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const rows = await sql`
      SELECT player_name, score, level_reached, kills, duration_sec, created_at
      FROM runs
      ORDER BY score DESC
      LIMIT 50
    `
    return NextResponse.json({ leaderboard: rows })
  } catch {
    return NextResponse.json({ leaderboard: [] }, { status: 200 })
  }
}
