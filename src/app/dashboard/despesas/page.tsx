"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { toast } from "sonner"
import { deleteDespesa } from "@/lib/storage"

interface Despesa {
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
}

interface Profissional {
  id: string
  obraId: string
  nome: string
  contrato?: {
    valorPrevisto: number
  }
}

interface Obra {
  id: string
  nome: string
  orcamentoTotalObra: number
  userId: string
}

export default function DespesasPage() {
  const router = useRouter()
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [despesaToDelete, setDespesaToDelete] = useState<Despesa | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    const user = JSON.parse(userData)

    // Carregar obra atual
    const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
    const obraEncontrada = obrasExistentes.find((o: Obra) => o.userId === user.email)
    if (!obraEncontrada) {
      router.push("/dashboard/obra")
      return
    }
    setObra(obraEncontrada)

    // Carregar profissionais da obra
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const profsDaObra = todosProfissionais.filter((p: Profissional) => p.obraId === obraEncontrada.id)
    setProfissionais(profsDaObra)

    // Carregar TODAS as despesas da obra
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const despesasDaObra = todasDespesas.filter((d: Despesa) => d.obraId === obraEncontrada.id)
    
    setDespesas(despesasDaObra)
    setLoading(false)
  }, [router])

  const handleOpenDeleteModal = (e: React.MouseEvent, despesa: Despesa) => {
    e.preventDefault()
    e.stopPropagation()
    setDespesaToDelete(despesa)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setDespesaToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!despesaToDelete) return

    setExcluindo(despesaToDelete.id)

    try {
      const sucesso = deleteDespesa(obra?.id || "", despesaToDelete.id)
      
      if (sucesso) {
        setDespesas(prev => prev.filter(d => d.id !== despesaToDelete.id))
        handleCloseDeleteModal()
        toast.success("Despesa excluída com sucesso!")
      } else {
        toast.error("Erro ao excluir despesa. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao excluir despesa:", error)
      toast.error("Erro ao excluir despesa. Tente novamente.")
    } finally {
      setExcluindo(null)
    }
  }

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  if (loading || !obra) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Filtrar despesas pelo período (mostrando TODAS por enquanto)
  const despesasFiltradas = despesas

  // Classificação segura (null-safe)
  const isMaoDeObra = (despesa: Despesa) => {
    // REGRA 1: Se tem professionalId, É mão de obra
    if (despesa?.professionalId) return true

    // REGRA 2: Verificar palavras-chave (com fallback seguro)
    const lowerTipo = (despesa?.tipo ?? "").toString().toLowerCase()
    const lowerCategoria = (despesa?.categoria ?? "").toString().toLowerCase()
    const lowerDescricao = (despesa?.descricao ?? "").toString().toLowerCase()
    const lowerCategory = (despesa?.category ?? "").toString().toLowerCase()

    const maoDeObraKeywords = [
      "mão de obra", "mao de obra", "serviço", "servico",
      "pedreiro", "pintor", "eletricista", "encanador",
      "diaria", "diária", "empreita", "empreitada", "mao_obra"
    ]

    const haystack = `${lowerTipo} ${lowerCategoria} ${lowerDescricao} ${lowerCategory}`
    return maoDeObraKeywords.some((k) => haystack.includes(k))
  }

  // Totais
  const totalPeriodo = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
  const totalMaterialOutros = despesasFiltradas.filter(d => !isMaoDeObra(d)).reduce((sum, d) => sum + d.valor, 0)
  const totalMaoDeObra = despesasFiltradas.filter(d => isMaoDeObra(d)).reduce((sum, d) => sum + d.valor, 0)

  // Orçamento previsto
  const maoDeObraPrevista = profissionais.reduce((sum, p) => sum + (p.contrato?.valorPrevisto || 0), 0)
  const materialPrevisto = Math.max(obra.orcamentoTotalObra - maoDeObraPrevista, 0)

  // Percentuais
  const orcamentoTotalObra = obra.orcamentoTotalObra
  const percentualMaterialOutros = orcamentoTotalObra > 0 ? (totalMaterialOutros / orcamentoTotalObra * 100).toFixed(1) : '—'
  const percentualMaoDeObra = orcamentoTotalObra > 0 ? (totalMaoDeObra / orcamentoTotalObra * 100).toFixed(1) : '—'

  // Distribuição
  const totalRealizado = totalMaterialOutros + totalMaoDeObra
  const percentualDistMaterial = totalRealizado > 0 ? (totalMaterialOutros / totalRealizado * 100).toFixed(1) : '0'
  const percentualDistMao = totalRealizado > 0 ? (totalMaoDeObra / totalRealizado * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Botão Voltar ao Dashboard */}
        <div className="mb-6">
          <button
            onClick={() => goToObraDashboard(router, obra?.id)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Dashboard</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600">{obra.nome}</p>
          <p className="text-sm text-gray-500 mt-1">
            Total de despesas: {despesasFiltradas.length}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Total no Período</h2>
            <p className="text-3xl font-bold text-gray-900">R$ {totalPeriodo.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Material/Outros</h2>
            <p className="text-3xl font-bold text-gray-900">R$ {totalMaterialOutros.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-gray-600">{percentualMaterialOutros}% do orçamento</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Mão de Obra</h2>
            <p className="text-3xl font-bold text-gray-900">R$ {totalMaoDeObra.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-gray-600">{percentualMaoDeObra}% do orçamento</p>
          </div>
        </div>

        {/* Distribuição */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição de Gastos</h2>
          <div className="flex h-6 rounded-full overflow-hidden bg-gray-200">
            <div
              className="bg-blue-500"
              style={{ width: `${percentualDistMaterial}%` }}
            ></div>
            <div
              className="bg-green-500"
              style={{ width: `${percentualDistMao}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Material/Outros: {percentualDistMaterial}%</span>
            <span>Mão de Obra: {percentualDistMao}%</span>
          </div>
        </div>

        {/* Tabela de Despesas */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Todas as Despesas ({despesasFiltradas.length})
          </h2>
          
          {despesasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma despesa registrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Descrição</th>
                    <th className="text-left py-2">Valor</th>
                    <th className="text-left py-2">Profissional</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {despesasFiltradas.map(despesa => {
                    const profissional = despesa.professionalId 
                      ? profissionais.find(p => p.id === despesa.professionalId)
                      : null
                    
                    return (
                      <tr key={despesa.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{new Date(despesa.data).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isMaoDeObra(despesa) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isMaoDeObra(despesa) ? 'Mão de Obra' : 'Material/Outros'}
                          </span>
                        </td>
                        <td className="py-3">{despesa.descricao || '-'}</td>
                        <td className="py-3 font-semibold">R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3">{profissional?.nome || '-'}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/despesas/${despesa.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/despesas/${despesa.id}/editar`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteModal(e, despesa)}
                              disabled={excluindo === despesa.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && despesaToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {/* Ícone de alerta */}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Excluir despesa?
            </h2>

            {/* Detalhes da despesa */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Descrição:</p>
              <p className="font-semibold text-gray-900 mb-3">{despesaToDelete.descricao || "Sem descrição"}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="font-semibold text-gray-900">{formatarMoeda(despesaToDelete.valor)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(despesaToDelete.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Texto de aviso */}
            <p className="text-gray-600 text-center mb-6">
              Esta ação é permanente e não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                disabled={excluindo !== null}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={excluindo !== null}
              >
                {excluindo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
