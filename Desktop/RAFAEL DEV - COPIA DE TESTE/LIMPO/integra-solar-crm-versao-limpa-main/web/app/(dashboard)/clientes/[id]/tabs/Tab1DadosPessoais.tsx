// web/app/(dashboard)/clientes/[id]/tabs/Tab1DadosPessoais.tsx
'use client'

import { useFormState } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'
import { updateTab1 } from '@/lib/clients/actions'
import type { Client, ActionResult } from '@/lib/clients/types'

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#E0E8F0',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.40)',
  marginBottom: 6,
  display: 'block',
}

export function Tab1DadosPessoais({ client }: { client: Client }) {
  const action = updateTab1.bind(null, client.id)
  const [state, formAction] = useFormState(action, {} as ActionResult)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <label style={labelStyle}>Tipo de pessoa</label>
        <select name="type" defaultValue={client.type ?? 'pf'} style={selectStyle}>
          <option value="pf">Pessoa Física</option>
          <option value="pj">Pessoa Jurídica</option>
        </select>
      </div>

      <Input name="name" label="Nome *" defaultValue={client.name} required />
      <Input name="cpf_cnpj" label="CPF / CNPJ" defaultValue={client.cpf_cnpj ?? ''} placeholder="000.000.000-00" />
      <Input name="email" label="Email" type="email" defaultValue={client.email ?? ''} />
      <Input name="phone" label="Telefone" defaultValue={client.phone ?? ''} placeholder="(11) 99999-9999" />

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input name="street" label="Rua" defaultValue={client.street ?? ''} />
        </div>
        <Input name="number" label="Número" defaultValue={client.number ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input name="neighborhood" label="Bairro" defaultValue={client.neighborhood ?? ''} />
        <Input name="zip" label="CEP" defaultValue={client.zip ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input name="city" label="Cidade" defaultValue={client.city ?? ''} />
        <Input name="state" label="Estado" defaultValue={client.state ?? ''} placeholder="SP" />
      </div>

      <FormError message={state?.error} />
      {state?.success && (
        <p className="text-sm" style={{ color: '#10B981' }}>{state.success}</p>
      )}
      <SubmitButton className="self-start">Salvar Dados Pessoais</SubmitButton>
    </form>
  )
}
