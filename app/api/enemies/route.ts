import { NextResponse } from 'next/server'
import { enemies } from '@/lib/game-data'
import { enemiesResponseSchema } from '@/lib/schema'

export const runtime = 'nodejs'

export function GET() {
  const payload = { enemies }
  const data = enemiesResponseSchema.parse(payload)
  return NextResponse.json(data)
}
