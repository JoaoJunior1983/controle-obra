/**
 * Funções centralizadas para manipulação de dados no localStorage
 * Garante consistência e reutilização em todo o projeto
 * 
 * FONTE ÚNICA DE VERDADE PARA MÃO DE OBRA:
 * - Pagamentos de profissionais = Despesas com category="mao_obra" + profissionalId
 * - Sempre sincronizados bidirecionalmente
 */

export interface Despesa {
  id: string
  obraId: string
  data: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  formaPagamento: string
  fornecedor?: string
  observacoes?: string
  category?: string
  professionalId?: string
  profissionalId?: string // Suporte a ambos os nomes
  criadoEm?: string
  atualizadoEm?: string
}

export interface Pagamento {
  id: string
  obraId: string
  profissionalId: string
  data: string
  valor: number
  formaPagamento?: string
  observacao?: string
}

export interface Obra {
  id: string
  userId: string
  nome: string
  tipo: string
  area: number
  localizacao: {
    estado: string
    cidade: string
  }
  orcamento: number | null
  dataInicio?: string | null
  dataTermino?: string | null
  criadaEm: string
}

export interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  valorPrevisto?: number
  contrato?: {
    valorPrevisto?: number
    valorTotalPrevisto?: number
  }
}

/**
 * Normalizar ID do profissional (suporta professionalId e profissionalId)
 */
function getProfissionalId(despesa: Despesa): string | undefined {
  return (despesa as any).professionalId || despesa.profissionalId
}

/**
 * Excluir uma despesa do localStorage
 * @param obraId - ID da obra (para validação futura)
 * @param despesaId - ID da despesa a ser excluída
 * @returns true se excluiu com sucesso, false caso contrário
 */
export function deleteDespesa(obraId: string, despesaId: string): boolean {
  try {
    if (!despesaId) {
      return false
    }

    // Ler todas as despesas
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    
    // Verificar se a despesa existe
    const despesaExiste = todasDespesas.some(d => d.id === despesaId)
    if (!despesaExiste) {
      return false
    }

    // Filtrar removendo a despesa
    const despesasAtualizadas = todasDespesas.filter(d => d.id !== despesaId)
    
    // Salvar de volta
    localStorage.setItem("despesas", JSON.stringify(despesasAtualizadas))
    
    return true
  } catch (error) {
    console.error("Erro ao excluir despesa:", error)
    return false
  }
}

/**
 * Excluir um pagamento (que é uma despesa de mão de obra vinculada a profissional)
 * @param obraId - ID da obra (para validação futura)
 * @param profissionalId - ID do profissional (para validação futura)
 * @param pagamentoId - ID do pagamento (despesa) a ser excluído
 * @returns true se excluiu com sucesso, false caso contrário
 */
export function deletePagamento(obraId: string, profissionalId: string, pagamentoId: string): boolean {
  try {
    if (!pagamentoId) {
      return false
    }

    // Pagamentos são despesas de mão de obra vinculadas ao profissional
    // Usar a mesma função de deleteDespesa
    return deleteDespesa(obraId, pagamentoId)
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error)
    return false
  }
}

/**
 * Obter todas as despesas de uma obra
 * @param obraId - ID da obra
 * @returns Array de despesas da obra
 */
export function getDespesasByObra(obraId: string): Despesa[] {
  try {
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    return todasDespesas.filter(d => d.obraId === obraId)
  } catch (error) {
    console.error("Erro ao carregar despesas:", error)
    return []
  }
}

/**
 * Obter todos os pagamentos de um profissional
 * FONTE ÚNICA DE VERDADE: Despesas com category="mao_obra" + profissionalId
 * @param obraId - ID da obra
 * @param profissionalId - ID do profissional
 * @returns Array de pagamentos (despesas de mão de obra) do profissional
 */
export function getPagamentosByProfissional(obraId: string, profissionalId: string): Despesa[] {
  try {
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    return todasDespesas.filter(d => {
      const category = String(d.category ?? d.categoria ?? "").toLowerCase()
      const profId = getProfissionalId(d)
      return d.obraId === obraId && 
             profId === profissionalId && 
             (category === "mao_obra" || category === "mão de obra")
    })
  } catch (error) {
    console.error("Erro ao carregar pagamentos:", error)
    return []
  }
}

/**
 * Obter todas as obras do usuário autenticado
 * @returns Array de obras do usuário
 */
export function getObrasDoUsuario(): Obra[] {
  try {
    const userData = localStorage.getItem("user")
    if (!userData) return []
    
    const user = JSON.parse(userData)
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    
    return todasObras.filter(o => o.userId === user.email)
  } catch (error) {
    console.error("Erro ao carregar obras:", error)
    return []
  }
}

/**
 * Definir a obra ativa no localStorage
 * @param obraId - ID da obra a ser definida como ativa
 */
export function setActiveObraId(obraId: string): void {
  try {
    localStorage.setItem("activeObraId", obraId)
  } catch (error) {
    console.error("Erro ao definir obra ativa:", error)
  }
}

/**
 * Obter o ID da obra ativa do localStorage
 * @returns ID da obra ativa ou null se não houver
 */
export function getActiveObraId(): string | null {
  try {
    return localStorage.getItem("activeObraId")
  } catch (error) {
    console.error("Erro ao obter obra ativa:", error)
    return null
  }
}

/**
 * Obter a obra ativa completa
 * @returns Obra ativa ou null se não houver
 */
export function getActiveObra(): Obra | null {
  try {
    const activeId = getActiveObraId()
    if (!activeId) return null
    
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    return todasObras.find(o => o.id === activeId) || null
  } catch (error) {
    console.error("Erro ao obter obra ativa:", error)
    return null
  }
}

/**
 * Calcular valor total pago a um profissional
 * FONTE ÚNICA: Soma das despesas de mão de obra vinculadas ao profissional
 * @param obraId - ID da obra
 * @param profissionalId - ID do profissional
 * @returns Valor total pago
 */
export function calcularValorPagoProfissional(obraId: string, profissionalId: string): number {
  const pagamentos = getPagamentosByProfissional(obraId, profissionalId)
  return pagamentos.reduce((acc, p) => acc + (p.valor ?? 0), 0)
}

/**
 * Calcular métricas financeiras de uma obra
 * @param obraId - ID da obra
 * @returns Objeto com métricas financeiras
 */
export function calcularMetricasObra(obraId: string) {
  try {
    const despesas = getDespesasByObra(obraId)
    const totalGasto = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0)
    
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]") as Profissional[]
    const profissionaisObra = todosProfissionais.filter(p => p.obraId === obraId)
    
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    const obra = todasObras.find(o => o.id === obraId)
    
    const orcamentoEstimado = obra?.orcamento || 0
    const saldoDisponivel = orcamentoEstimado - totalGasto
    const areaM2 = obra?.area || 0
    const custoPorM2 = areaM2 > 0 ? totalGasto / areaM2 : 0
    
    return {
      orcamentoEstimado,
      totalGasto,
      saldoDisponivel,
      custoPorM2,
      areaM2
    }
  } catch (error) {
    console.error("Erro ao calcular métricas:", error)
    return {
      orcamentoEstimado: 0,
      totalGasto: 0,
      saldoDisponivel: 0,
      custoPorM2: 0,
      areaM2: 0
    }
  }
}

/**
 * Excluir uma obra e TODOS os dados vinculados (CASCADE)
 * Remove: despesas, profissionais, contratos, pagamentos, alertas, notificações
 * @param obraId - ID da obra a ser excluída
 * @returns true se excluiu com sucesso, false caso contrário
 */
export function deleteObraCascade(obraId: string): boolean {
  try {
    if (!obraId) {
      return false
    }

    // 1. Remover a obra
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    const obrasAtualizadas = todasObras.filter(o => o.id !== obraId)
    localStorage.setItem("obras", JSON.stringify(obrasAtualizadas))

    // 2. Remover todas as despesas da obra
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    const despesasAtualizadas = todasDespesas.filter(d => d.obraId !== obraId)
    localStorage.setItem("despesas", JSON.stringify(despesasAtualizadas))

    // 3. Remover todos os profissionais da obra
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]") as Profissional[]
    const profissionaisAtualizados = todosProfissionais.filter(p => p.obraId !== obraId)
    localStorage.setItem("profissionais", JSON.stringify(profissionaisAtualizados))

    // 4. Remover contratos/combined da obra
    const todosCombined = JSON.parse(localStorage.getItem("combined") || "[]")
    const combinedAtualizados = todosCombined.filter((c: any) => c.obraId !== obraId)
    localStorage.setItem("combined", JSON.stringify(combinedAtualizados))

    // 5. Remover alertas da obra
    const todosAlertas = JSON.parse(localStorage.getItem("alertas") || "[]")
    const alertasAtualizados = todosAlertas.filter((a: any) => a.obraId !== obraId)
    localStorage.setItem("alertas", JSON.stringify(alertasAtualizados))

    // 6. Remover notificações da obra
    const todasNotificacoes = JSON.parse(localStorage.getItem("notificacoes") || "[]")
    const notificacoesAtualizadas = todasNotificacoes.filter((n: any) => n.obraId !== obraId)
    localStorage.setItem("notificacoes", JSON.stringify(notificacoesAtualizadas))

    // 7. Limpar obra ativa se for a que está sendo excluída
    const activeObraId = getActiveObraId()
    if (activeObraId === obraId) {
      localStorage.removeItem("activeObraId")
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir obra em cascata:", error)
    return false
  }
}
