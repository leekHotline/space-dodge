import { NextResponse } from 'next/server'
import { dropConfig, levelConfig } from '@/lib/game-data'
import { configResponseSchema } from '@/lib/schema'

export const runtime = 'nodejs'

export function GET() {
  const payload = {
    levelConfig,
    dropConfig
  }
  const data = configResponseSchema.parse(payload)
  return NextResponse.json(data)
}
