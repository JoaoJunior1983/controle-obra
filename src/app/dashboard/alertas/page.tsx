"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  Trash2, 
  Calendar, 
  Wallet, 
  AlertCircle,
  Settings,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  getAlertaOrcamentoByObra,
  createOrUpdateAlertaOrcamento,
  getAlertasPrazoByObra,
  createAlertaPrazo,
  deleteAlertaPrazo,
  getAlertasPagamentoByObra,
  createAlertaPagamento,
  deleteAlertaPagamento,
  verificarTodosAlertas,
  type AlertaPrazo,
  type AlertaPagamento
} from "@/lib/alerts"

export default function AlertasPage() {
  const router = useRouter()
  const [obraId, setObraId] = useState<string>("")
  const [obraNome, setObraNome] = useState<string>("")
  const [orcamento, setOrcamento] = useState<number>(0)
  const [totalGasto, setTotalGasto] = useState<number>(0)
  
  // Alertas de orçamento
  const [alertaOrcamentoAtivo, setAlertaOrcamentoAtivo] = useState(false)
  const [percentuais, setPercentuais] = useState<number[]>([80, 100])
  
  // Alertas de prazo
  const [alertasPrazo, setAlertasPrazo] = useState<AlertaPrazo[]>([])
  
  // Alertas de pagamento
  const [alertasPagamento, setAlertasPagamento] = useState<AlertaPagamento[]>([])
  
  // Modais
  const [modalConfig, setModalConfig] = useState(false)
  const [modalPrazo, setModalPrazo] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)
  
  // Profissionais (para select)
  const [profissionais, setProfissionais] = useState<any[]>([])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const activeObraId = localStorage.getItem("activeObraId")
    if (!activeObraId) {
      router.push("/obras")
      return
    }

    setObraId(activeObraId)

    // Carregar obra
    const obras = JSON.parse(localStorage.getItem("obras") || "[]")
    const obra = obras.find((o: any) => o.id === activeObraId)
    if (obra) {
      setObraNome(obra.nome)
      setOrcamento(obra.orcamento || 0)
    }

    // Calcular total gasto
    const despesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const despesasObra = despesas.filter((d: any) => d.obraId === activeObraId)
    const total = despesasObra.reduce((acc: number, d: any) => acc + (d.valor || 0), 0)
    setTotalGasto(total)

    // Carregar profissionais
    const profs = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const profsObra = profs.filter((p: any) => p.obraId === activeObraId)
    setProfissionais(profsObra)

    // Carregar alertas
    loadAlertas(activeObraId)

    // Verificar alertas automaticamente
    verificarTodosAlertas(activeObraId, obra?.orcamento || 0, total)
  }, [router])

  const loadAlertas = (obraId: string) => {
    // Alerta de orçamento
    const alertaOrc = getAlertaOrcamentoByObra(obraId)
    if (alertaOrc) {
      setAlertaOrcamentoAtivo(alertaOrc.ativo)
      setPercentuais(alertaOrc.percentuais)
    }

    // Alertas de prazo
    const prazo = getAlertasPrazoByObra(obraId)
    setAlertasPrazo(prazo)

    // Alertas de pagamento
    const pagamento = getAlertasPagamentoByObra(obraId)
    setAlertasPagamento(pagamento)
  }

  const handleSalvarAlertaOrcamento = () => {
    createOrUpdateAlertaOrcamento(obraId, alertaOrcamentoAtivo, percentuais)
    setModalConfig(false)
    
    // Verificar imediatamente
    verificarTodosAlertas(obraId, orcamento, totalGasto)
  }

  const handleCriarAlertaPrazo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const titulo = formData.get("titulo") as string
    const data = formData.get("data") as string
    const avisoAntecipado = parseInt(formData.get("avisoAntecipado") as string)

    createAlertaPrazo(obraId, titulo, data, avisoAntecipado)
    loadAlertas(obraId)
    setModalPrazo(false)
    
    // Verificar
    verificarTodosAlertas(obraId, orcamento, totalGasto)
  }

  const handleExcluirAlertaPrazo = (id: string) => {
    if (confirm("Deseja excluir este alerta de prazo?")) {
      deleteAlertaPrazo(id)
      loadAlertas(obraId)
    }
  }

  const handleCriarAlertaPagamento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const titulo = formData.get("titulo") as string
    const categoria = formData.get("categoria") as "profissional" | "material" | "outros"
    const valorStr = formData.get("valor") as string
    const valor = valorStr ? parseFloat(valorStr) : undefined
    const profissionalId = formData.get("profissionalId") as string || undefined
    const dataInicial = formData.get("dataInicial") as string
    const recorrencia = formData.get("recorrencia") as "unico" | "semanal" | "mensal"
    const diaSemanaStr = formData.get("diaSemana") as string
    const diaSemana = diaSemanaStr ? parseInt(diaSemanaStr) : undefined
    const lembreteStr = formData.get("lembreteAntecipado") as string
    const lembreteAntecipado = lembreteStr ? parseInt(lembreteStr) : undefined

    createAlertaPagamento(
      obraId,
      titulo,
      categoria,
      dataInicial,
      recorrencia,
      valor,
      profissionalId,
      diaSemana,
      lembreteAntecipado
    )
    
    loadAlertas(obraId)
    setModalPagamento(false)
    
    // Verificar
    verificarTodosAlertas(obraId, orcamento, totalGasto)
  }

  const handleExcluirAlertaPagamento = (id: string) => {
    if (confirm("Deseja excluir este alerta de pagamento?")) {
      deleteAlertaPagamento(id)
      loadAlertas(obraId)
    }
  }

  const formatarData = (dataISO: string): string => {
    const data = new Date(dataISO)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/obra")}
          className="mb-4 hover:bg-blue-50 text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Alertas e Notificações
            </h1>
            <p className="text-sm text-gray-500">{obraNome}</p>
          </div>
        </div>

        {/* Botão Configurar Alertas */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Configurações Gerais</h2>
              <p className="text-sm text-gray-600">
                Configure alertas de orçamento e outros avisos importantes
              </p>
            </div>
            <Button
              onClick={() => setModalConfig(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar Alertas
            </Button>
          </div>
        </Card>

        {/* Status dos Alertas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-gray-900">Orçamento</h3>
            </div>
            <p className={`text-sm font-medium ${alertaOrcamentoAtivo ? "text-green-600" : "text-gray-500"}`}>
              {alertaOrcamentoAtivo ? "Ativado" : "Desativado"}
            </p>
            {alertaOrcamentoAtivo && (
              <p className="text-xs text-gray-600 mt-1">
                Alertas em: {percentuais.join("%, ")}%
              </p>
            )}
          </Card>

          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-gray-900">Prazos</h3>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {alertasPrazo.length} {alertasPrazo.length === 1 ? "alerta" : "alertas"}
            </p>
          </Card>

          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Pagamentos</h3>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {alertasPagamento.length} {alertasPagamento.length === 1 ? "alerta" : "alertas"}
            </p>
          </Card>
        </div>

        {/* Alertas de Prazo */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">Alertas de Prazo</h2>
            </div>
            <Button
              onClick={() => setModalPrazo(true)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Alerta
            </Button>
          </div>

          {alertasPrazo.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum alerta de prazo configurado
            </p>
          ) : (
            <div className="space-y-3">
              {alertasPrazo.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{alerta.titulo}</h3>
                    <p className="text-sm text-gray-600">
                      Data: {formatarData(alerta.data)} • Aviso: {alerta.avisoAntecipado} {alerta.avisoAntecipado === 1 ? "dia" : "dias"} antes
                    </p>
                    {alerta.disparado && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                        <Check className="w-3 h-3" />
                        Disparado
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluirAlertaPrazo(alerta.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alertas de Pagamento */}
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Alertas de Pagamento</h2>
            </div>
            <Button
              onClick={() => setModalPagamento(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Alerta
            </Button>
          </div>

          {alertasPagamento.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum alerta de pagamento configurado
            </p>
          ) : (
            <div className="space-y-3">
              {alertasPagamento.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{alerta.titulo}</h3>
                    <p className="text-sm text-gray-600">
                      {alerta.valor && `${formatarMoeda(alerta.valor)} • `}
                      {alerta.categoria === "profissional" ? "Profissional" : alerta.categoria === "material" ? "Material" : "Outros"}
                      {" • "}
                      {alerta.recorrencia === "unico" ? "Único" : alerta.recorrencia === "semanal" ? "Semanal" : "Mensal"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Próxima data: {formatarData(alerta.proximaData)}
                      {alerta.lembreteAntecipado && ` • Lembrete: ${alerta.lembreteAntecipado} ${alerta.lembreteAntecipado === 1 ? "dia" : "dias"} antes`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluirAlertaPagamento(alerta.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Modal Configurar Alertas de Orçamento */}
        <Dialog open={modalConfig} onOpenChange={setModalConfig}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Alertas de Orçamento</DialogTitle>
              <DialogDescription>
                Receba avisos quando os gastos atingirem percentuais do orçamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo" className="text-base">
                  Ativar alertas de orçamento
                </Label>
                <Switch
                  id="ativo"
                  checked={alertaOrcamentoAtivo}
                  onCheckedChange={setAlertaOrcamentoAtivo}
                />
              </div>

              {alertaOrcamentoAtivo && (
                <div className="space-y-3 pt-4 border-t">
                  <Label>Alertar quando atingir:</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={percentuais.includes(80)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPercentuais([...percentuais, 80].sort((a, b) => a - b))
                          } else {
                            setPercentuais(percentuais.filter(p => p !== 80))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">80% do orçamento</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={percentuais.includes(100)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPercentuais([...percentuais, 100].sort((a, b) => a - b))
                          } else {
                            setPercentuais(percentuais.filter(p => p !== 100))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">100% do orçamento</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setModalConfig(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarAlertaOrcamento}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Novo Alerta de Prazo */}
        <Dialog open={modalPrazo} onOpenChange={setModalPrazo}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Alerta de Prazo</DialogTitle>
              <DialogDescription>
                Configure uma data importante da obra
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCriarAlertaPrazo} className="space-y-4 py-4">
              <div>
                <Label htmlFor="titulo">Título do alerta</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  placeholder="Ex: Entrega de material"
                  required
                />
              </div>

              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  required
                />
              </div>

              <div>
                <Label htmlFor="avisoAntecipado">Avisar com antecedência</Label>
                <Select name="avisoAntecipado" defaultValue="1" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPrazo(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Criar Alerta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Novo Alerta de Pagamento */}
        <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Alerta de Pagamento</DialogTitle>
              <DialogDescription>
                Configure um lembrete de pagamento
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCriarAlertaPagamento} className="space-y-4 py-4">
              <div>
                <Label htmlFor="titulo-pag">Título do pagamento</Label>
                <Input
                  id="titulo-pag"
                  name="titulo"
                  placeholder="Ex: Pagamento pedreiro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select name="categoria" defaultValue="profissional" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor-pag">Valor (opcional)</Label>
                <Input
                  id="valor-pag"
                  name="valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                />
              </div>

              {profissionais.length > 0 && (
                <div>
                  <Label htmlFor="profissionalId">Profissional (opcional)</Label>
                  <Select name="profissionalId">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profissionais.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="dataInicial">Data inicial</Label>
                <Input
                  id="dataInicial"
                  name="dataInicial"
                  type="date"
                  required
                />
              </div>

              <div>
                <Label htmlFor="recorrencia">Recorrência</Label>
                <Select name="recorrencia" defaultValue="unico" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lembreteAntecipado">Lembrete antecipado (opcional)</Label>
                <Select name="lembreteAntecipado">
                  <SelectTrigger>
                    <SelectValue placeholder="Sem lembrete" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPagamento(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Criar Alerta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
