"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, Wallet, PiggyBank, Home, Plus, AlertCircle, Bell, BellOff, Users, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface Obra {
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

interface Despesa {
  id: string
  obraId: string
  valor: number
  tipo?: string
  category?: string // Novo campo
}

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  contrato?: {
    valorTotalPrevisto: number
  }
}

export default function DashboardObraPage() {
  const router = useRouter()
  const [obra, setObra] = useState<Obra | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [detalhamentoAtivo, setDetalhamentoAtivo] = useState<"material" | "mao_obra" | null>(null)

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Carregar obra mais recente do usuário
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const user = JSON.parse(userData)
    const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
    
    // Pegar a obra mais recente do usuário
    const obrasDoUsuario = obrasExistentes.filter((o: Obra) => o.userId === user.email)
    if (obrasDoUsuario.length > 0) {
      const obraMaisRecente = obrasDoUsuario[obrasDoUsuario.length - 1]
      setObra(obraMaisRecente)

      // Carregar despesas da obra
      const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
      const despesasObra = todasDespesas.filter((d: Despesa) => d.obraId === obraMaisRecente.id)
      setDespesas(despesasObra)

      // Carregar profissionais da obra
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const profissionaisObra = todosProfissionais.filter((p: Profissional) => p.obraId === obraMaisRecente.id)
      setProfissionais(profissionaisObra)
    } else {
      // Se não tem obra, redireciona para criar
      router.push("/dashboard/criar-obra")
    }

    setLoading(false)
  }, [router])

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatarData = (dataISO: string): string => {
    const data = new Date(dataISO)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const calcularDiasRestantes = (dataTermino: string): { dias: number; atrasado: boolean } => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const termino = new Date(dataTermino)
    termino.setHours(0, 0, 0, 0)
    
    const diferencaMs = termino.getTime() - hoje.getTime()
    const dias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24))
    
    return {
      dias: Math.abs(dias),
      atrasado: dias < 0
    }
  }

  const calcularTotalGasto = (): number => {
    return despesas.reduce((acc, d) => acc + d.valor, 0)
  }

  const calcularSaldoDisponivel = (): number => {
    if (!obra || !obra.orcamento) return 0
    return obra.orcamento - calcularTotalGasto()
  }

  const calcularCustoPorM2 = (): string => {
    if (!obra || !obra.area) return "R$ 0,00"
    const totalGasto = calcularTotalGasto()
    if (totalGasto === 0) return "R$ 0,00"
    const custo = totalGasto / obra.area
    return formatarMoeda(custo)
  }

  const calcularPercentualGasto = (): number => {
    if (!obra || !obra.orcamento || obra.orcamento === 0) return 0
    return (calcularTotalGasto() / obra.orcamento) * 100
  }

  const calcularMaoObraPrevista = (): number => {
    return profissionais.reduce((acc, p) => {
      return acc + (p.contrato?.valorTotalPrevisto || 0)
    }, 0)
  }

  const calcularMaoObraRealizada = (): number => {
    return despesas
      .filter(d => d.category === "mao_obra")
      .reduce((acc, d) => acc + d.valor, 0)
  }

  const calcularDistribuicao = () => {
    const totalGasto = calcularTotalGasto()
    if (totalGasto === 0) {
      return { 
        material: 0, 
        maoObra: 0, 
        outros: 0,
        percMaterial: 0, 
        percMaoObra: 0,
        percOutros: 0
      }
    }

    const material = despesas
      .filter(d => d.category === "material")
      .reduce((acc, d) => acc + d.valor, 0)
    
    const maoObra = despesas
      .filter(d => d.category === "mao_obra")
      .reduce((acc, d) => acc + d.valor, 0)

    const outros = despesas
      .filter(d => d.category === "outros" || !d.category)
      .reduce((acc, d) => acc + d.valor, 0)

    // Material + Outros combinados
    const materialOutros = material + outros
    const percMaterialOutros = (materialOutros / totalGasto) * 100

    return {
      material,
      maoObra,
      outros,
      materialOutros,
      percMaterial: (material / totalGasto) * 100,
      percMaoObra: (maoObra / totalGasto) * 100,
      percOutros: (outros / totalGasto) * 100,
      percMaterialOutros
    }
  }

  const getDespesasPorCategoria = (categoria: "material" | "mao_obra") => {
    if (categoria === "material") {
      return despesas.filter(d => d.category === "material" || d.category === "outros" || !d.category)
    }
    return despesas.filter(d => d.category === "mao_obra")
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

  if (!obra) {
    return null
  }

  const totalGasto = calcularTotalGasto()
  const saldoDisponivel = calcularSaldoDisponivel()
  const percentualGasto = calcularPercentualGasto()
  const distribuicao = calcularDistribuicao()
  const maoObraPrevista = calcularMaoObraPrevista()
  const maoObraRealizada = calcularMaoObraRealizada()

  // Verificar se existem datas de prazo
  const temPrazo = obra.dataInicio || obra.dataTermino
  const prazoInfo = obra.dataTermino ? calcularDiasRestantes(obra.dataTermino) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo OBREASY no topo */}
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
            onClick={() => router.push("/dashboard")}
            className="mb-4 hover:bg-blue-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {obra.nome}
              </h1>
              <p className="text-sm text-gray-500">
                {obra.tipo === "construcao" ? "Construção" : "Reforma"} • {obra.localizacao.cidade}/{obra.localizacao.estado}
              </p>
            </div>
          </div>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Orçamento Estimado */}
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Orçamento Estimado</p>
            <p className="text-2xl font-bold text-gray-900">
              {obra.orcamento ? formatarMoeda(obra.orcamento) : "Não definido"}
            </p>
          </Card>

          {/* Total Gasto */}
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Total Gasto</p>
            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(totalGasto)}</p>
            {obra.orcamento && (
              <p className="text-xs text-gray-500 mt-1">{percentualGasto.toFixed(1)}% do orçamento</p>
            )}
          </Card>

          {/* Saldo Disponível */}
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Saldo Disponível</p>
            <p className="text-2xl font-bold text-gray-900">
              {obra.orcamento ? formatarMoeda(saldoDisponivel) : "R$ 0,00"}
            </p>
          </Card>

          {/* Custo por m² */}
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Custo por m²</p>
            <p className="text-2xl font-bold text-gray-900">{calcularCustoPorM2()}</p>
            <p className="text-xs text-gray-500 mt-1">{obra.area} m²</p>
          </Card>
        </div>

        {/* Card Prazo da Obra - NOVO (somente se existirem datas) */}
        {temPrazo && (
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Prazo da Obra</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Data de Início */}
              {obra.dataInicio && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Data de Início</p>
                  <p className="text-lg font-bold text-gray-900">{formatarData(obra.dataInicio)}</p>
                </div>
              )}

              {/* Data Prevista de Término */}
              {obra.dataTermino && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Previsão de Término</p>
                  <p className="text-lg font-bold text-gray-900">{formatarData(obra.dataTermino)}</p>
                </div>
              )}
            </div>

            {/* Cálculo de dias restantes/atraso */}
            {prazoInfo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  prazoInfo.atrasado 
                    ? "bg-red-50 border border-red-200" 
                    : "bg-green-50 border border-green-200"
                }`}>
                  <Clock className={`w-5 h-5 ${prazoInfo.atrasado ? "text-red-600" : "text-green-600"}`} />
                  <div>
                    <p className={`font-bold ${prazoInfo.atrasado ? "text-red-900" : "text-green-900"}`}>
                      {prazoInfo.atrasado 
                        ? `Obra em atraso há ${prazoInfo.dias} ${prazoInfo.dias === 1 ? "dia" : "dias"}`
                        : `Faltam ${prazoInfo.dias} ${prazoInfo.dias === 1 ? "dia" : "dias"} para o término`
                      }
                    </p>
                    <p className={`text-sm ${prazoInfo.atrasado ? "text-red-700" : "text-green-700"}`}>
                      {prazoInfo.atrasado 
                        ? "Considere revisar o cronograma e ajustar prazos"
                        : "Obra dentro do prazo previsto"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Cards de Acesso Rápido - Despesas e Profissionais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Card Despesas */}
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Despesas</h3>
                <p className="text-sm text-gray-500">
                  {despesas.length} {despesas.length === 1 ? "despesa registrada" : "despesas registradas"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard/despesas/nova")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Despesa
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/despesas")}
                className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Ver todas
              </Button>
            </div>
          </Card>

          {/* Card Profissionais */}
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Profissionais</h3>
                <p className="text-sm text-gray-500">
                  {profissionais.length} {profissionais.length === 1 ? "profissional cadastrado" : "profissionais cadastrados"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard/profissionais/novo")}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Profissional
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/profissionais")}
                className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                Ver todos
              </Button>
            </div>
          </Card>
        </div>

        {/* Distribuição de Gastos - DOIS BLOCOS SIMULTÂNEOS */}
        {totalGasto > 0 && (
          <Card className="p-6 sm:p-8 bg-white shadow-lg mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Distribuição de Gastos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BLOCO 1: Material / Outros */}
              <div 
                className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer bg-blue-50/30"
                onClick={() => setDetalhamentoAtivo(detalhamentoAtivo === "material" ? null : "material")}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Material / Outros</h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total acumulado</span>
                  <span className="text-sm font-bold text-blue-600">
                    {totalGasto > 0 ? distribuicao.percMaterialOutros.toFixed(1) : "0.0"}%
                  </span>
                </div>
                
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${distribuicao.percMaterialOutros}%` }}
                  />
                </div>
                
                <p className="text-2xl font-bold text-gray-900">{formatarMoeda(distribuicao.materialOutros)}</p>
                
                {distribuicao.materialOutros === 0 && (
                  <p className="text-sm text-gray-500 italic mt-2">Nenhuma despesa registrada ainda</p>
                )}
              </div>

              {/* BLOCO 2: Mão de Obra */}
              <div 
                className="border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 transition-all cursor-pointer bg-orange-50/30"
                onClick={() => setDetalhamentoAtivo(detalhamentoAtivo === "mao_obra" ? null : "mao_obra")}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Mão de Obra</h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total acumulado</span>
                  <span className="text-sm font-bold text-orange-600">
                    {totalGasto > 0 ? distribuicao.percMaoObra.toFixed(1) : "0.0"}%
                  </span>
                </div>
                
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-orange-600 rounded-full transition-all"
                    style={{ width: `${distribuicao.percMaoObra}%` }}
                  />
                </div>
                
                <p className="text-2xl font-bold text-gray-900">{formatarMoeda(distribuicao.maoObra)}</p>
                
                {maoObraPrevista > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Previsto: {formatarMoeda(maoObraPrevista)}
                  </p>
                )}
                
                {distribuicao.maoObra === 0 && (
                  <p className="text-sm text-gray-500 italic mt-2">Nenhuma despesa registrada ainda</p>
                )}
              </div>
            </div>

            {/* Detalhamento das despesas (quando clicado) */}
            {detalhamentoAtivo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-bold text-gray-900 mb-4">
                  Despesas de {detalhamentoAtivo === "material" ? "Material / Outros" : "Mão de Obra"}
                </h4>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getDespesasPorCategoria(detalhamentoAtivo).length > 0 ? (
                    getDespesasPorCategoria(detalhamentoAtivo).map((despesa: any) => (
                      <div key={despesa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{despesa.descricao || "Sem descrição"}</p>
                          <p className="text-sm text-gray-500">{despesa.data ? formatarData(despesa.data) : "Sem data"}</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatarMoeda(despesa.valor)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center py-4">
                      Nenhuma despesa nesta categoria
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Estado Vazio - Despesas */}
        {despesas.length === 0 && (
          <Card className="p-8 sm:p-12 bg-white shadow-lg mb-8">
            <div className="text-center max-w-2xl mx-auto">
              {/* Ícone decorativo */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-6">
                <Wallet className="w-10 h-10 text-blue-600" />
              </div>

              {/* Mensagem principal */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Nenhuma despesa lançada ainda
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Comece registrando sua primeira despesa para acompanhar os gastos da obra em tempo real.
              </p>

              {/* CTA Principal */}
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
                onClick={() => router.push("/dashboard/despesas/nova")}
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar primeira despesa
              </Button>

              <p className="text-sm text-gray-500 mt-6">
                Registre materiais, mão de obra, equipamentos e outros custos
              </p>
            </div>
          </Card>
        )}

        {/* Seção de Alertas */}
        <Card className="p-6 sm:p-8 bg-white shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Alertas e Notificações</h2>
              <p className="text-sm text-gray-500">Configure avisos para orçamento e prazo</p>
            </div>
          </div>

          {/* Alertas desativados */}
          <div className="space-y-4">
            <Alert className="border-gray-200 bg-gray-50">
              <BellOff className="h-4 w-4 text-gray-500" />
              <AlertDescription className="text-gray-600">
                <span className="font-semibold">Alertas de orçamento:</span> Desativados
                <p className="text-sm text-gray-500 mt-1">
                  Receba avisos quando os gastos atingirem 80% e 100% do orçamento estimado.
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-gray-200 bg-gray-50">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <AlertDescription className="text-gray-600">
                <span className="font-semibold">Alertas de prazo:</span> Desativados
                <p className="text-sm text-gray-500 mt-1">
                  Configure datas importantes e receba lembretes para manter sua obra no cronograma.
                </p>
              </AlertDescription>
            </Alert>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                // Futura configuração de alertas
                alert("Em breve: Configuração de alertas")
              }}
            >
              <Bell className="w-4 h-4 mr-2" />
              Configurar alertas
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
