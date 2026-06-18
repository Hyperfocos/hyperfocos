import { NextResponse } from 'next/server'
import { getProposalsByLead, getSuppliers, getGenerationFactor } from '@/lib/crm/queries'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [proposals, suppliers, generationFactor] = await Promise.all([
    getProposalsByLead(params.id),
    getSuppliers(),
    getGenerationFactor(),
  ])
  return NextResponse.json({ proposals, suppliers, generationFactor })
}
