import { NextResponse } from 'next/server'
import { items } from '@/lib/game-data'
import { itemsResponseSchema } from '@/lib/schema'

export const runtime = 'nodejs'

export function GET() {
  const payload = { items }
  const data = itemsResponseSchema.parse(payload)
  return NextResponse.json(data)
}
