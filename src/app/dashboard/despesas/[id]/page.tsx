"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, DollarSign, FileText, User, CreditCard, MessageSquare, Trash2 } from "lucide-react"
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
  criadoEm?: string
  atualizadoEm?: string
}

interface Profissional {
  id: string
  nome: string
}

interface Obra {
  id: string
  nome: string
}

export default function DetalhesDespesaPage() {
  const router = useRouter()
  const params = useParams()
  const despesaId = params.id as string

  const [despesa, setDespesa] = useState<Despesa | null>(null)
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState(false)

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

    // Carregar despesa
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const despesaEncontrada = todasDespesas.find((d: Despesa) => d.id === despesaId)
    
    if (!despesaEncontrada) {
      alert("Despesa não encontrada!")
      router.push("/dashboard/despesas")
      return
    }

    setDespesa(despesaEncontrada)

    // Carregar profissional se houver
    if (despesaEncontrada.professionalId) {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const profissionalEncontrado = todosProfissionais.find((p: Profissional) => p.id === despesaEncontrada.professionalId)
      if (profissionalEncontrado) {
        setProfissional(profissionalEncontrado)
      }
    }

    setLoading(false)
  }, [router, despesaId])

  if (loading || !despesa || !obra) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Classificação
  const isMaoDeObra = () => {
    if (despesa?.professionalId) return true

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

  const handleExcluirDespesa = async () => {
    if (!despesa || !despesa.id) {
      toast.error("Despesa inválida")
      return
    }

    if (!confirm("Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.")) {
      return
    }

    setExcluindo(true)

    try {
      // Usar função centralizada de exclusão
      const sucesso = deleteDespesa(obra?.id || "", despesa.id)
      
      if (sucesso) {
        toast.success("Despesa excluída com sucesso!")
        
        // Redirecionar para lista de despesas
        setTimeout(() => {
          router.push("/dashboard/despesas")
        }, 500)
      } else {
        toast.error("Erro ao excluir despesa. Tente novamente.")
        setExcluindo(false)
      }
    } catch (error) {
      console.error("Erro ao excluir despesa:", error)
      toast.error("Erro ao excluir despesa. Tente novamente.")
      setExcluindo(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Botões de navegação */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => router.push("/dashboard/despesas")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para Despesas</span>
          </button>
          <button
            onClick={() => goToObraDashboard(router, obra?.id)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Dashboard</span>
          </button>
        </div>

        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Detalhes da Despesa</h1>
          <p className="text-gray-600">{obra.nome}</p>
        </div>

        {/* Card de Detalhes */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Tipo/Categoria */}
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Tipo/Categoria</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded text-sm font-medium ${
                isMaoDeObra() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isMaoDeObra() ? 'Mão de Obra' : 'Material/Outros'}
              </span>
              {despesa.categoria && (
                <p className="text-gray-700 mt-1">{despesa.categoria}</p>
              )}
            </div>
          </div>

          {/* Data */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Data</p>
              <p className="text-gray-900 font-medium">
                {new Date(despesa.data).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Valor */}
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Valor</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Descrição */}
          {despesa.descricao && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Descrição</p>
                <p className="text-gray-900">{despesa.descricao}</p>
              </div>
            </div>
          )}

          {/* Profissional */}
          {profissional && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Profissional Vinculado</p>
                <p className="text-gray-900 font-medium">{profissional.nome}</p>
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          {despesa.formaPagamento && (
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Forma de Pagamento</p>
                <p className="text-gray-900">{despesa.formaPagamento}</p>
              </div>
            </div>
          )}

          {/* Fornecedor */}
          {despesa.fornecedor && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Fornecedor</p>
                <p className="text-gray-900">{despesa.fornecedor}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {despesa.observacoes && (
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Observações</p>
                <p className="text-gray-900">{despesa.observacoes}</p>
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
              {despesa.criadoEm && (
                <div>
                  <p className="font-medium">Criado em</p>
                  <p>{new Date(despesa.criadoEm).toLocaleString('pt-BR')}</p>
                </div>
              )}
              {despesa.atualizadoEm && (
                <div>
                  <p className="font-medium">Atualizado em</p>
                  <p>{new Date(despesa.atualizadoEm).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Botão Editar */}
          <div className="pt-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => router.push(`/dashboard/despesas/${despesa.id}/editar`)}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
            >
              Editar Despesa
            </button>
            <button
              type="button"
              onClick={handleExcluirDespesa}
              disabled={excluindo}
              className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {excluindo ? "Excluindo..." : "Excluir Despesa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
