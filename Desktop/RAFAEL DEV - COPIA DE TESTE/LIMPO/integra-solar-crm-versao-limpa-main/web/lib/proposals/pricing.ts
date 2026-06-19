import type { OrgConfig } from '@/lib/configuracoes/queries'

export type PricingBreakdown = {
  custo_kit: number
  custo_projeto: number
  custo_instalacao: number
  custo_km: number
  custo_ca: number
  soma_custos: number
  preco_total: number
}

export type PricingInput = {
  kit_value: number
  total_power_kwp: number
  panel_qty: number
}

export function calcularPreco(
  input: PricingInput,
  config: OrgConfig
): PricingBreakdown {
  const {
    kit_value,
    total_power_kwp,
    panel_qty,
  } = input

  const pct_imposto   = config.pct_imposto   ?? 0
  const pct_margem    = config.pct_margem    ?? 0
  const pct_comissao  = config.pct_comissao  ?? 0
  const pct_ca        = config.pct_material_ca ?? 0

  const valor_projeto_por_kwp      = config.valor_projeto_por_kwp      ?? 0
  const valor_instalacao_por_placa = config.valor_instalacao_por_placa ?? 0

  const divisor = 1 - pct_imposto - pct_margem - pct_comissao

  const custo_kit        = kit_value
  const custo_projeto    = total_power_kwp * valor_projeto_por_kwp
  const custo_instalacao = panel_qty * valor_instalacao_por_placa
  const custo_km         = 0
  const custo_ca         = kit_value * pct_ca

  const soma_custos = custo_kit + custo_projeto + custo_instalacao + custo_km + custo_ca
  const preco_total = divisor > 0 ? soma_custos / divisor : soma_custos

  return {
    custo_kit,
    custo_projeto,
    custo_instalacao,
    custo_km,
    custo_ca,
    soma_custos,
    preco_total,
  }
}
