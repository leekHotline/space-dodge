import { NextResponse } from 'next/server'
import { enemies } from '@/lib/game-data'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({ enemies })
}
