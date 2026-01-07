"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Users, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { toast } from "sonner"
import { goToObraDashboard } from "@/lib/navigation"

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  telefone?: string
  observacoes?: string
  valorPrevisto?: number
  contrato?: {
    tipoCobranca: string
    valorCombinado: number
    quantidadeBase: number
    valorTotalPrevisto: number
    dataInicio?: string
    dataTermino?: string
  }
  pagamentos?: Array<{
    id: string
    data: string
    valor: number
    formaPagamento: string
    observacao?: string
  }>
  extras?: Array<{
    id: string
    data: string
    descricao: string
    valor: number
    status: "Pendente" | "Aprovado" | "Rejeitado"
    observacao?: string
  }>
  despesas?: Array<{
    id: string
    data: string
    descricao: string
    valor: number
    category: string
  }>
}

interface Obra {
  id: string
  nome: string
}

export default function ProfissionaisPage() {
  const router = useRouter()
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Carregar obra atual
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const user = JSON.parse(userData)
    const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
    const obrasDoUsuario = obrasExistentes.filter((o: any) => o.userId === user.email)
    
    if (obrasDoUsuario.length > 0) {
      const obraMaisRecente = obrasDoUsuario[obrasDoUsuario.length - 1]
      setObra(obraMaisRecente)

      // Carregar profissionais da obra
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const profissionaisObra = todosProfissionais.filter((p: Profissional) => p.obraId === obraMaisRecente.id)
      setProfissionais(profissionaisObra)
    }

    setLoading(false)
  }, [router])

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const calcularTotalPagoViaDespesas = (profissional: Profissional): number => {
    if (!profissional.despesas) return 0
    return profissional.despesas
      .filter(d => String(d.category ?? "").toLowerCase() === "mao_obra")
      .reduce((acc, d) => acc + d.valor, 0)
  }

  const calcularValorPago = (profissional: Profissional): number => {
    const pagamentos = profissional.pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0
    const despesas = calcularTotalPagoViaDespesas(profissional)
    return pagamentos + despesas
  }

  const calcularValorPrevisto = (profissional: Profissional): number => {
    // Priorizar valorPrevisto direto do profissional, depois do contrato
    return profissional.valorPrevisto || profissional.contrato?.valorTotalPrevisto || 0
  }

  const calcularSaldoPagar = (profissional: Profissional): number => {
    const valorPrevisto = calcularValorPrevisto(profissional)
    const valorPago = calcularValorPago(profissional)
    return valorPrevisto - valorPago
  }

  const getCorSaldo = (saldo: number): string => {
    // REGRA CORRIGIDA: Azul/neutro se >= 0, vermelho se < 0
    return saldo < 0 ? "text-red-600" : "text-blue-600"
  }

  const handleExcluir = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este profissional?")) {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const novosProfissionais = todosProfissionais.filter((p: Profissional) => p.id !== id)
      localStorage.setItem("profissionais", JSON.stringify(novosProfissionais))
      
      setProfissionais(profissionais.filter(p => p.id !== id))
      toast.success("Profissional excluído com sucesso!")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo OBREASY */}
        <div className="mb-6">
          <Image
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/979b9040-0d37-4e0d-ae77-88fcfe603d77.png"
            alt="Logo OBREASY"
            width={120}
            height={120}
            className="h-12 w-auto"
            priority
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => goToObraDashboard(router, obra?.id)}
            className="mb-4 hover:bg-blue-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Profissionais
                </h1>
                {obra && (
                  <p className="text-sm text-gray-500">{obra.nome}</p>
                )}
              </div>
            </div>

            <Button
              onClick={() => router.push("/dashboard/profissionais/novo")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Profissional
            </Button>
          </div>
        </div>

        {profissionais.length === 0 ? (
          // Empty State
          <Card className="p-8 sm:p-12 bg-white shadow-lg">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-6">
                <Users className="w-10 h-10 text-blue-600" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Nenhum profissional cadastrado
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Comece cadastrando o primeiro profissional para controlar pagamentos e serviços.
              </p>

              <Button
                size="lg"
                onClick={() => router.push("/dashboard/profissionais/novo")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar primeiro profissional
              </Button>
            </div>
          </Card>
        ) : (
          // Lista de Profissionais
          <div className="grid grid-cols-1 gap-4">
            {profissionais.map((profissional) => {
              const valorPago = calcularValorPago(profissional)
              const valorPrevisto = calcularValorPrevisto(profissional)
              const saldoPagar = calcularSaldoPagar(profissional)

              return (
                <Card key={profissional.id} className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Informações do Profissional */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{profissional.nome}</h3>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                          {profissional.funcao}
                        </Badge>
                      </div>
                      
                      {profissional.telefone && (
                        <p className="text-sm text-gray-500 mb-3">{profissional.telefone}</p>
                      )}

                      {/* Valores */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Valor Previsto</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {valorPrevisto > 0 ? formatarMoeda(valorPrevisto) : "Não definido"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Valor Pago</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatarMoeda(valorPago)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Saldo a Pagar</p>
                          <p className={`text-lg font-semibold ${getCorSaldo(saldoPagar)}`}>
                            {formatarMoeda(saldoPagar)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex sm:flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/profissionais/${profissional.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/profissionais/${profissional.id}?edit=true`)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExcluir(profissional.id)}
                        className="border-red-600 text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
