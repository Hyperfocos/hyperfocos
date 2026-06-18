// web/app/(dashboard)/clientes/[id]/tabs/Tab8PastaCompleta.tsx
import type { Client } from '@/lib/clients/types'
import { ATTACHMENT_TYPE_LABELS } from '@/lib/clients/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {title}
      </p>
      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs flex-shrink-0 w-40" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{display}</span>
    </div>
  )
}

export function Tab8PastaCompleta({ client }: { client: Client }) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl pb-8">
      <Section title="Dados Pessoais">
        <Row label="Tipo" value={client.type === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'} />
        <Row label="Nome" value={client.name} />
        <Row label="CPF/CNPJ" value={client.cpf_cnpj} />
        <Row label="Email" value={client.email} />
        <Row label="Telefone" value={client.phone} />
        <Row label="Endereço" value={[client.street, client.number, client.neighborhood, client.city, client.state].filter(Boolean).join(', ')} />
        <Row label="CEP" value={client.zip} />
      </Section>

      <Section title="Equipamentos Vendidos">
        <Row label="kWh prometido/mês" value={client.promised_kwh} />
        <Row label="Potência do sistema" value={client.system_power_kwp ? `${client.system_power_kwp} kWp` : null} />
        <Row label="Painel" value={[client.panel_brand, client.panel_power_w ? `${client.panel_power_w}W` : null].filter(Boolean).join(' ')} />
        <Row label="Inversor" value={[client.inverter_brand, client.inverter_power_w ? `${client.inverter_power_w}W` : null].filter(Boolean).join(' ')} />
        <Row label="Painéis específicos" value={client.specific_panels} />
        <Row label="Inversor específico" value={client.specific_inverter} />
        <Row label="Entrega direta" value={client.direct_delivery} />
      </Section>

      {client.sale && (
        <Section title="Venda e Faturamento">
          <Row label="Valor da venda" value={client.sale.sale_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Row label="Forma de pagamento" value={client.sale.payment_method} />
          <Row label="Comissão" value={client.sale.commission_pct ? `${client.sale.commission_pct}%` : null} />
          <Row label="Obs. NF" value={client.sale.nf_notes} />
          {client.installments.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Parcelas</span>
              {client.installments
                .sort((a, b) => a.position - b.position)
                .map((inst) => (
                  <div key={inst.id} className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="w-20">{inst.position === 1 ? 'Entrada' : `Parcela ${inst.position}`}</span>
                    <span>{new Date(inst.due_date).toLocaleDateString('pt-BR')}</span>
                    <span>{inst.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: inst.status === 'confirmada' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                        color: inst.status === 'confirmada' ? '#10B981' : 'rgba(255,255,255,0.40)',
                      }}
                    >
                      {inst.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Section>
      )}

      <Section title="Vistoria">
        <Row label="Tipo de telhado" value={client.roof_type} />
        <Row label="Orientação" value={client.roof_orientation} />
        <Row label="Coordenadas" value={client.maps_coordinates} />
        <Row label="Disjuntor entrada" value={client.entry_breaker} />
        <Row label="Cabo entrada" value={client.entry_cable_mm} />
        <Row label="Obras de adaptação" value={client.has_adaptation_works} />
        <Row label="Vistoria feita" value={client.inspection_done} />
        <Row label="Observações" value={client.client_notes} />
        <Row label="Promessas extras" value={client.extra_promises} />
      </Section>

      <Section title="Prazos">
        <Row label="Data do contrato" value={client.contract_date ? new Date(client.contract_date).toLocaleDateString('pt-BR') : null} />
        <Row label="Prazo máximo" value={client.contract_max_days ? `${client.contract_max_days} dias` : null} />
        <Row label="Início do prazo" value={client.delivery_start_date ? new Date(client.delivery_start_date).toLocaleDateString('pt-BR') : null} />
      </Section>

      {client.attachments.length > 0 && (
        <Section title="Anexos">
          {client.attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {ATTACHMENT_TYPE_LABELS[att.type] ?? att.type}
              </span>
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs"
                style={{ color: '#3B82F6' }}
              >
                ver →
              </a>
            </div>
          ))}
        </Section>
      )}

      {client.contract && (
        <Section title="Contrato">
          {client.contract.contract_url && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Contrato</span>
              <a href={client.contract.contract_url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#3B82F6' }}>ver →</a>
            </div>
          )}
          {client.contract.power_of_attorney_url && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Procuração</span>
              <a href={client.contract.power_of_attorney_url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#3B82F6' }}>ver →</a>
            </div>
          )}
          <Row label="Assinado" value={client.contract.signed} />
        </Section>
      )}
    </div>
  )
}
