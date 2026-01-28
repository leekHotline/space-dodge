import { NextResponse } from 'next/server'
import { dropConfig, levelConfig } from '@/lib/game-data'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({
    levelConfig,
    dropConfig
  })
}
