// web/app/(dashboard)/configuracoes/page.tsx
import { getOrgConfig, getLeadOrigins } from '@/lib/configuracoes/queries'
import { getColaboradores } from '@/lib/colaboradores/queries'
import { getAuditLogs } from '@/lib/auditoria/queries'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const [config, origins, colaboradores, { logs, total }] = await Promise.all([
    getOrgConfig(),
    getLeadOrigins(),
    getColaboradores(),
    getAuditLogs(1, 20),
  ])

  return (
    <ConfiguracoesClient
      config={config}
      origins={origins}
      colaboradores={colaboradores}
      auditLogs={logs}
      auditTotal={total}
    />
  )
}
