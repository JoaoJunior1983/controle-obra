"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, FileText, Save, X, Edit, Trash2, Plus, DollarSign } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Image from "next/image"

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  telefone?: string
  observacoes?: string
  valorPrevisto?: number
  contrato?: {
    tipoContrato: string
    dataInicio?: string
    dataTermino?: string
    observacoes?: string
    valorPrevisto: number
    // auxiliares
    valorCombinado?: number
    diaria?: number
    qtdDiarias?: number
    valorM2?: number
    areaM2?: number
    valorUnidade?: number
    qtdUnidades?: number
    etapas?: Array<{ nome: string; valor: number }>
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

export default function ProfissionalDetalhePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingContrato, setIsEditingContrato] = useState(false)
  const [valorCombinadoFormatado, setValorCombinadoFormatado] = useState("")
  const [editForm, setEditForm] = useState({
    nome: "",
    funcao: "",
    telefone: "",
    observacoes: "",
    contrato: {
      tipoContrato: "",
      dataInicio: "",
      dataTermino: "",
      observacoes: "",
      valorPrevisto: 0,
      valorCombinado: 0,
      diaria: 0,
      qtdDiarias: 0,
      valorM2: 0,
      areaM2: 0,
      valorUnidade: 0,
      qtdUnidades: 0,
      etapas: [] as Array<{ nome: string; valor: number }>
    }
  })

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Carregar profissional
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const prof = todosProfissionais.find((p: Profissional) => p.id === id)
    if (!prof) {
      router.push("/dashboard/profissionais")
      return
    }

    setProfissional(prof)

    // Carregar obra
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
      const obraEncontrada = obrasExistentes.find((o: any) => o.id === prof.obraId && o.userId === user.email)
      if (obraEncontrada) {
        setObra(obraEncontrada)
      }
    }

    // Inicializar editForm
    setEditForm({
      nome: prof.nome,
      funcao: prof.funcao,
      telefone: prof.telefone || "",
      observacoes: prof.observacoes || "",
      contrato: prof.contrato || {
        tipoContrato: "",
        dataInicio: "",
        dataTermino: "",
        observacoes: "",
        valorPrevisto: 0,
        valorCombinado: 0,
        diaria: 0,
        qtdDiarias: 0,
        valorM2: 0,
        areaM2: 0,
        valorUnidade: 0,
        qtdUnidades: 0,
        etapas: []
      }
    })

    // Inicializar valor combinado formatado
    if (prof.contrato?.valorCombinado) {
      setValorCombinadoFormatado(formatarMoeda(prof.contrato.valorCombinado))
    }

    setLoading(false)
  }, [id, router])

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatarMoedaInput = (valor: string): string => {
    // Remove tudo que não é número
    const numero = valor.replace(/\D/g, "")
    
    if (!numero) return ""
    
    // Converte para número e divide por 100 (centavos)
    const valorNumerico = Number(numero) / 100
    
    // Formata como moeda brasileira
    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const converterMoedaParaNumero = (valorFormatado: string): number => {
    // Remove R$, espaços e pontos de milhar, substitui vírgula por ponto
    const numero = valorFormatado
      .replace(/R\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
    
    return Number(numero) || 0
  }

  const calcularTotalPagoViaDespesas = (prof: Profissional): number => {
    if (!prof.despesas) return 0
    return prof.despesas
      .filter(d => String(d.category ?? "").toLowerCase() === "mao_obra")
      .reduce((acc, d) => acc + d.valor, 0)
  }

  const calcularValorPago = (prof: Profissional): number => {
    const pagamentos = prof.pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0
    const despesas = calcularTotalPagoViaDespesas(prof)
    return pagamentos + despesas
  }

  const calcularValorPrevisto = (prof: Profissional): number => {
    return prof.valorPrevisto || prof.contrato?.valorPrevisto || 0
  }

  const calcularSaldoPagar = (prof: Profissional): number => {
    const valorPrevisto = calcularValorPrevisto(prof)
    const valorPago = calcularValorPago(prof)
    return valorPrevisto - valorPago
  }

  const getCorSaldo = (saldo: number): string => {
    // REGRA CORRIGIDA: Azul/neutro se >= 0, vermelho se < 0
    return saldo < 0 ? "text-red-600" : "text-blue-600"
  }

  const calcularValorPrevistoContrato = (contrato: typeof editForm.contrato): number => {
    switch (contrato.tipoContrato) {
      case "empreitada":
        return contrato.valorCombinado || 0
      case "diaria":
        return (contrato.diaria || 0) * (contrato.qtdDiarias || 0)
      case "por_m2":
        return (contrato.valorM2 || 0) * (contrato.areaM2 || 0)
      case "por_unidade":
        return (contrato.valorUnidade || 0) * (contrato.qtdUnidades || 0)
      case "por_etapa":
        return contrato.etapas?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0
      default:
        return 0
    }
  }

  const handleContratoChange = (field: string, value: any) => {
    const updatedContrato = { ...editForm.contrato, [field]: value }
    const valorPrevisto = calcularValorPrevistoContrato(updatedContrato)
    setEditForm({
      ...editForm,
      contrato: { ...updatedContrato, valorPrevisto }
    })
  }

  const handleValorCombinadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setValorCombinadoFormatado(valorFormatado)
    
    const valorNumerico = converterMoedaParaNumero(valorFormatado)
    handleContratoChange("valorCombinado", valorNumerico)
  }

  const handleSalvar = async () => {
    try {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
      if (index === -1) throw new Error("Profissional não encontrado")

      const profissionalAtualizado = {
        ...todosProfissionais[index],
        nome: editForm.nome,
        funcao: editForm.funcao,
        telefone: editForm.telefone,
        observacoes: editForm.observacoes,
        contrato: editForm.contrato
      }

      todosProfissionais[index] = profissionalAtualizado
      localStorage.setItem("profissionais", JSON.stringify(todosProfissionais))

      setProfissional(profissionalAtualizado)
      setIsEditing(false)
      toast.success("Profissional salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
      toast.error("Erro ao salvar profissional")
    }
  }

  const validarContrato = (): boolean => {
    if (!editForm.contrato.tipoContrato) {
      toast.error("Selecione o tipo de contrato")
      return false
    }
    switch (editForm.contrato.tipoContrato) {
      case "empreitada":
        if (!editForm.contrato.valorCombinado || editForm.contrato.valorCombinado <= 0) {
          toast.error("Informe o valor combinado")
          return false
        }
        break
      case "diaria":
        if (!editForm.contrato.diaria || editForm.contrato.diaria <= 0) {
          toast.error("Informe o valor da diária")
          return false
        }
        if (!editForm.contrato.qtdDiarias || editForm.contrato.qtdDiarias <= 0) {
          toast.error("Informe a quantidade de diárias")
          return false
        }
        break
      case "por_m2":
        if (!editForm.contrato.valorM2 || editForm.contrato.valorM2 <= 0) {
          toast.error("Informe o valor por m²")
          return false
        }
        if (!editForm.contrato.areaM2 || editForm.contrato.areaM2 <= 0) {
          toast.error("Informe a área em m²")
          return false
        }
        break
      case "por_unidade":
        if (!editForm.contrato.valorUnidade || editForm.contrato.valorUnidade <= 0) {
          toast.error("Informe o valor por unidade")
          return false
        }
        if (!editForm.contrato.qtdUnidades || editForm.contrato.qtdUnidades <= 0) {
          toast.error("Informe a quantidade de unidades")
          return false
        }
        break
      case "por_etapa":
        if (!editForm.contrato.etapas || editForm.contrato.etapas.length === 0) {
          toast.error("Adicione pelo menos uma etapa")
          return false
        }
        break
    }
    return true
  }

  const handleSalvarContrato = async () => {
    if (!validarContrato()) return

    try {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
      if (index === -1) throw new Error("Profissional não encontrado")

      // Calcular valorPrevisto do contrato
      const valorPrevistoContrato = calcularValorPrevistoContrato(editForm.contrato)

      const profissionalAtualizado = {
        ...todosProfissionais[index],
        contrato: {
          ...editForm.contrato,
          valorPrevisto: valorPrevistoContrato
        },
        // ATUALIZAR valorPrevisto do profissional
        valorPrevisto: valorPrevistoContrato
      }

      todosProfissionais[index] = profissionalAtualizado
      localStorage.setItem("profissionais", JSON.stringify(todosProfissionais))

      setProfissional(profissionalAtualizado)
      setIsEditingContrato(false)
      toast.success("Contrato salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar contrato:", error)
      toast.error("Erro ao salvar contrato")
    }
  }

  const handleExcluirContrato = async () => {
    if (!profissional) return

    if (confirm("Tem certeza que deseja excluir o contrato/combinado? Esta ação não pode ser desfeita.")) {
      try {
        const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
        const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
        if (index === -1) throw new Error("Profissional não encontrado")

        const profissionalAtualizado = {
          ...todosProfissionais[index],
          contrato: undefined,
          valorPrevisto: 0
        }

        todosProfissionais[index] = profissionalAtualizado
        localStorage.setItem("profissionais", JSON.stringify(todosProfissionais))

        setProfissional(profissionalAtualizado)
        setEditForm({
          ...editForm,
          contrato: {
            tipoContrato: "",
            dataInicio: "",
            dataTermino: "",
            observacoes: "",
            valorPrevisto: 0,
            valorCombinado: 0,
            diaria: 0,
            qtdDiarias: 0,
            valorM2: 0,
            areaM2: 0,
            valorUnidade: 0,
            qtdUnidades: 0,
            etapas: []
          }
        })
        setValorCombinadoFormatado("")
        toast.success("Contrato excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir contrato:", error)
        toast.error("Erro ao excluir contrato")
      }
    }
  }

  const handleExcluirPagamento = (pagamentoId: string) => {
    if (!profissional) return

    if (confirm("Tem certeza que deseja excluir este pagamento?")) {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
      if (index === -1) return

      const profissionalAtualizado = {
        ...todosProfissionais[index],
        pagamentos: todosProfissionais[index].pagamentos?.filter(p => p.id !== pagamentoId) || []
      }

      todosProfissionais[index] = profissionalAtualizado
      localStorage.setItem("profissionais", JSON.stringify(todosProfissionais))

      setProfissional(profissionalAtualizado)
      toast.success("Pagamento excluído com sucesso!")
    }
  }

  if (loading || !profissional) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  const valorPago = calcularValorPago(profissional)
  const valorPrevisto = calcularValorPrevisto(profissional)
  const saldoPagar = calcularSaldoPagar(profissional)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
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
            onClick={() => router.push("/dashboard/profissionais")}
            className="mb-4 hover:bg-blue-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Profissionais
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {profissional.nome}
                </h1>
                {obra && (
                  <p className="text-sm text-gray-500">{obra.nome}</p>
                )}
              </div>
            </div>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
            >
              <Edit className="w-5 h-5 mr-2" />
              {isEditing ? "Cancelar Edição" : "Editar Profissional"}
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-6">
          {/* Informações Gerais */}
          <Card className="p-6 bg-white shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações Gerais
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="funcao">Função</Label>
                    <Input
                      id="funcao"
                      value={editForm.funcao}
                      onChange={(e) => setEditForm({...editForm, funcao: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={editForm.telefone}
                    onChange={(e) => setEditForm({...editForm, telefone: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm({...editForm, observacoes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSalvar} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="border-gray-300">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-semibold text-gray-900">{profissional.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Função</p>
                    <p className="font-semibold text-gray-900">{profissional.funcao}</p>
                  </div>
                </div>

                {profissional.telefone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-semibold text-gray-900">{profissional.telefone}</p>
                  </div>
                )}

                {profissional.observacoes && (
                  <div>
                    <p className="text-sm text-gray-500">Observações</p>
                    <p className="font-semibold text-gray-900">{profissional.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Resumo Financeiro */}
          <Card className="p-6 bg-white shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Valor Previsto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {valorPrevisto > 0 ? formatarMoeda(valorPrevisto) : "Não definido"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Valor Pago</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(valorPago)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Saldo a Pagar</p>
                <p className={`text-2xl font-bold ${getCorSaldo(saldoPagar)}`}>{formatarMoeda(saldoPagar)}</p>
              </div>
            </div>
          </Card>

          {/* Contrato / Combinado */}
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contrato / Combinado
              </h2>
              <Button onClick={() => {
                setIsEditingContrato(true)
                // Inicializar valor formatado ao abrir edição
                if (editForm.contrato.valorCombinado) {
                  setValorCombinadoFormatado(formatarMoeda(editForm.contrato.valorCombinado))
                }
              }} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                {profissional.contrato ? "Editar" : "Definir"}
              </Button>
            </div>

            {isEditingContrato ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                  <Select
                    value={editForm.contrato.tipoContrato}
                    onValueChange={(value) => handleContratoChange("tipoContrato", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empreitada">Empreitada (valor fechado)</SelectItem>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="por_m2">Por m²</SelectItem>
                      <SelectItem value="por_unidade">Por unidade</SelectItem>
                      <SelectItem value="por_etapa">Por etapa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.contrato.tipoContrato === "empreitada" && (
                  <div>
                    <Label htmlFor="valorCombinado">Valor Combinado</Label>
                    <Input
                      id="valorCombinado"
                      type="text"
                      value={valorCombinadoFormatado}
                      onChange={handleValorCombinadoChange}
                      placeholder="R$ 0,00"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}

                {editForm.contrato.tipoContrato === "diaria" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="diaria">Valor da Diária</Label>
                        <Input
                          id="diaria"
                          type="number"
                          step="0.01"
                          value={editForm.contrato.diaria || ""}
                          onChange={(e) => handleContratoChange("diaria", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="qtdDiarias">Quantidade de Diárias Previstas</Label>
                        <Input
                          id="qtdDiarias"
                          type="number"
                          value={editForm.contrato.qtdDiarias || ""}
                          onChange={(e) => handleContratoChange("qtdDiarias", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {editForm.contrato.tipoContrato === "por_m2" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valorM2">Valor por m²</Label>
                        <Input
                          id="valorM2"
                          type="number"
                          step="0.01"
                          value={editForm.contrato.valorM2 || ""}
                          onChange={(e) => handleContratoChange("valorM2", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="areaM2">Área (m²)</Label>
                        <Input
                          id="areaM2"
                          type="number"
                          step="0.01"
                          value={editForm.contrato.areaM2 || ""}
                          onChange={(e) => handleContratoChange("areaM2", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {editForm.contrato.tipoContrato === "por_unidade" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valorUnidade">Valor por Unidade</Label>
                        <Input
                          id="valorUnidade"
                          type="number"
                          step="0.01"
                          value={editForm.contrato.valorUnidade || ""}
                          onChange={(e) => handleContratoChange("valorUnidade", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="qtdUnidades">Quantidade Prevista</Label>
                        <Input
                          id="qtdUnidades"
                          type="number"
                          value={editForm.contrato.qtdUnidades || ""}
                          onChange={(e) => handleContratoChange("qtdUnidades", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {editForm.contrato.tipoContrato === "por_etapa" && (
                  <div>
                    <Label>Etapas</Label>
                    {editForm.contrato.etapas?.map((etapa, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                        <Input
                          placeholder="Nome da etapa"
                          value={etapa.nome}
                          onChange={(e) => {
                            const newEtapas = [...editForm.contrato.etapas!]
                            newEtapas[index].nome = e.target.value
                            handleContratoChange("etapas", newEtapas)
                          }}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Valor"
                          value={etapa.valor || ""}
                          onChange={(e) => {
                            const newEtapas = [...editForm.contrato.etapas!]
                            newEtapas[index].valor = Number(e.target.value)
                            handleContratoChange("etapas", newEtapas)
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newEtapas = [...(editForm.contrato.etapas || []), { nome: "", valor: 0 }]
                        handleContratoChange("etapas", newEtapas)
                      }}
                    >
                      Adicionar Etapa
                    </Button>
                  </div>
                )}

                {editForm.contrato.tipoContrato && (
                  <div>
                    <Label>Valor Previsto</Label>
                    <Input
                      value={formatarMoeda(editForm.contrato.valorPrevisto)}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataInicio">Data de Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={editForm.contrato.dataInicio}
                      onChange={(e) => handleContratoChange("dataInicio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataTermino">Data de Término</Label>
                    <Input
                      id="dataTermino"
                      type="date"
                      value={editForm.contrato.dataTermino}
                      onChange={(e) => handleContratoChange("dataTermino", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoesContrato">Observações</Label>
                  <Textarea
                    id="observacoesContrato"
                    value={editForm.contrato.observacoes}
                    onChange={(e) => handleContratoChange("observacoes", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSalvarContrato} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Contrato
                  </Button>
                  <Button onClick={() => setIsEditingContrato(false)} variant="outline" className="border-gray-300">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              profissional.contrato ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Contrato</p>
                      <p className="font-semibold text-gray-900">
                        {profissional.contrato.tipoContrato === "empreitada" ? "Empreitada (valor fechado)" :
                         profissional.contrato.tipoContrato === "diaria" ? "Diária" :
                         profissional.contrato.tipoContrato === "por_m2" ? "Por m²" :
                         profissional.contrato.tipoContrato === "por_unidade" ? "Por unidade" :
                         profissional.contrato.tipoContrato === "por_etapa" ? "Por etapa" : profissional.contrato.tipoContrato}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor Previsto</p>
                      <p className="font-semibold text-gray-900">{formatarMoeda(profissional.contrato.valorPrevisto)}</p>
                    </div>
                  </div>

                  {(profissional.contrato.dataInicio || profissional.contrato.dataTermino) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      {profissional.contrato.dataInicio && (
                        <div>
                          <p className="text-sm text-gray-500">Data de Início</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(profissional.contrato.dataInicio).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {profissional.contrato.dataTermino && (
                        <div>
                          <p className="text-sm text-gray-500">Data de Término</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(profissional.contrato.dataTermino).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {profissional.contrato.observacoes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">Observações</p>
                      <p className="font-semibold text-gray-900">{profissional.contrato.observacoes}</p>
                    </div>
                  )}

                  {/* Texto informativo */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 italic">
                      💡 Se houver alteração de escopo ou reorçamento, você pode ajustar este contrato pelo botão Editar.
                    </p>
                  </div>

                  {/* Botão Excluir Contrato */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleExcluirContrato}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir contrato/combinado
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum contrato definido</p>
                </div>
              )
            )}
          </Card>

          {/* Pagamentos */}
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pagamentos
              </h2>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Navegar para tela de novo pagamento (implementar rota se necessário)
                  toast.info("Funcionalidade de novo pagamento em desenvolvimento")
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </div>

            {profissional.pagamentos && profissional.pagamentos.length > 0 ? (
              <div className="space-y-4">
                {profissional.pagamentos.map((pagamento) => (
                  <div key={pagamento.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{formatarMoeda(pagamento.valor)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(pagamento.data).toLocaleDateString('pt-BR')} - {pagamento.formaPagamento}
                      </p>
                      {pagamento.observacao && (
                        <p className="text-sm text-gray-600 mt-1">{pagamento.observacao}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExcluirPagamento(pagamento.id)}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pagamento registrado</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
