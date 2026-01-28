import { NextResponse } from 'next/server'
import { items } from '@/lib/game-data'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({ items })
}
