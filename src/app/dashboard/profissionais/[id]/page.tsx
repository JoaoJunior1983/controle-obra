"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, FileText, Save, X, Edit, Trash2, Plus, DollarSign } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { deletePagamento } from "@/lib/storage"
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
    valorCombinado?: number
    diaria?: number
    qtdDiarias?: number
    valorM2?: number
    areaM2?: number
    valorUnidade?: number
    qtdUnidades?: number
    etapas?: Array<{ nome: string; valor: number }>
  }
}

interface Despesa {
  id: string
  obraId: string
  data: string
  valor: number
  categoria?: string
  category?: string
  descricao?: string
  formaPagamento?: string
  observacao?: string
  profissionalId?: string
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
  const [pagamentos, setPagamentos] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingContrato, setIsEditingContrato] = useState(false)
  const [modalNovoPagamento, setModalNovoPagamento] = useState(false)
  const [modalEditarPagamento, setModalEditarPagamento] = useState(false)
  const [pagamentoEditando, setPagamentoEditando] = useState<string | null>(null)
  const [valorCombinadoFormatado, setValorCombinadoFormatado] = useState("")
  const [excluindoContrato, setExcluindoContrato] = useState(false)
  const [excluindoPagamento, setExcluindoPagamento] = useState<string | null>(null)
  const [showDeleteContratoModal, setShowDeleteContratoModal] = useState(false)
  const [showDeletePagamentoModal, setShowDeletePagamentoModal] = useState(false)
  const [pagamentoToDelete, setPagamentoToDelete] = useState<Despesa | null>(null)
  
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

  const [novoPagamentoForm, setNovoPagamentoForm] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: "",
    valorFormatado: "",
    formaPagamento: "dinheiro",
    observacao: ""
  })

  const [editarPagamentoForm, setEditarPagamentoForm] = useState({
    data: "",
    valor: "",
    valorFormatado: "",
    formaPagamento: "",
    observacao: ""
  })

  const carregarPagamentos = () => {
    // FONTE ÚNICA DE VERDADE: Despesas com category="mao_obra" + profissionalId
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const despesasDoProfissional = todasDespesas.filter((d: Despesa) => {
      const category = String(d.category ?? d.categoria ?? "").toLowerCase()
      // Suportar tanto professionalId quanto profissionalId
      const profId = (d as any).professionalId || d.profissionalId
      return profId === id && (category === "mao_obra" || category === "mão de obra")
    })
    setPagamentos(despesasDoProfissional)
  }

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const prof = todosProfissionais.find((p: Profissional) => p.id === id)
    if (!prof) {
      router.push("/dashboard/profissionais")
      return
    }

    setProfissional(prof)

    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
      const obraEncontrada = obrasExistentes.find((o: any) => o.id === prof.obraId && o.userId === user.email)
      if (obraEncontrada) {
        setObra(obraEncontrada)
      }
    }

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

    if (prof.contrato?.valorCombinado) {
      setValorCombinadoFormatado(formatarMoeda(prof.contrato.valorCombinado))
    }

    carregarPagamentos()
    setLoading(false)
  }, [id, router])

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatarMoedaInput = (valor: string): string => {
    const numero = valor.replace(/\D/g, "")
    if (!numero) return ""
    const valorNumerico = Number(numero) / 100
    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const converterMoedaParaNumero = (valorFormatado: string): number => {
    const numero = valorFormatado
      .replace(/R\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
    return Number(numero) || 0
  }

  const calcularValorPago = (): number => {
    return pagamentos.reduce((acc, p) => acc + p.valor, 0)
  }

  const calcularValorPrevisto = (): number => {
    return profissional?.valorPrevisto || profissional?.contrato?.valorPrevisto || 0
  }

  const calcularSaldoPagar = (): number => {
    const valorPrevisto = calcularValorPrevisto()
    const valorPago = calcularValorPago()
    return valorPrevisto - valorPago
  }

  const getCorSaldo = (saldo: number): string => {
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

      const valorPrevistoContrato = calcularValorPrevistoContrato(editForm.contrato)

      const profissionalAtualizado = {
        ...todosProfissionais[index],
        contrato: {
          ...editForm.contrato,
          valorPrevisto: valorPrevistoContrato
        },
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

  const handleOpenDeleteContratoModal = () => {
    setShowDeleteContratoModal(true)
  }

  const handleCloseDeleteContratoModal = () => {
    setShowDeleteContratoModal(false)
  }

  const handleConfirmDeleteContrato = async () => {
    if (!profissional) {
      toast.error("Profissional não encontrado")
      return
    }

    setExcluindoContrato(true)

    try {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
      
      if (index === -1) {
        toast.error("Profissional não encontrado")
        return
      }

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
      
      handleCloseDeleteContratoModal()
      toast.success("Contrato excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir contrato:", error)
      toast.error("Erro ao excluir contrato. Tente novamente.")
    } finally {
      setExcluindoContrato(false)
    }
  }

  const handleOpenDeletePagamentoModal = (pagamento: Despesa) => {
    setPagamentoToDelete(pagamento)
    setShowDeletePagamentoModal(true)
  }

  const handleCloseDeletePagamentoModal = () => {
    setShowDeletePagamentoModal(false)
    setPagamentoToDelete(null)
  }

  const handleConfirmDeletePagamento = async () => {
    if (!pagamentoToDelete) return

    setExcluindoPagamento(pagamentoToDelete.id)

    try {
      const sucesso = deletePagamento(obra?.id || "", id, pagamentoToDelete.id)
      
      if (sucesso) {
        toast.success("Pagamento excluído com sucesso!")
        carregarPagamentos()
        handleCloseDeletePagamentoModal()
        
        // Disparar evento para atualizar lista de profissionais
        window.dispatchEvent(new CustomEvent("pagamentoAtualizado", { detail: { profissionalId: id } }))
      } else {
        toast.error("Erro ao excluir pagamento. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error)
      toast.error("Erro ao excluir pagamento. Tente novamente.")
    } finally {
      setExcluindoPagamento(null)
    }
  }

  const handleAbrirModalNovoPagamento = () => {
    setNovoPagamentoForm({
      data: new Date().toISOString().split('T')[0],
      valor: "",
      valorFormatado: "",
      formaPagamento: "dinheiro",
      observacao: ""
    })
    setModalNovoPagamento(true)
  }

  const handleAbrirModalEditarPagamento = (pagamento: Despesa) => {
    setPagamentoEditando(pagamento.id)
    setEditarPagamentoForm({
      data: pagamento.data,
      valor: String(pagamento.valor),
      valorFormatado: formatarMoeda(pagamento.valor),
      formaPagamento: pagamento.formaPagamento || "dinheiro",
      observacao: pagamento.observacao || ""
    })
    setModalEditarPagamento(true)
  }

  const handleValorPagamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setNovoPagamentoForm({
      ...novoPagamentoForm,
      valorFormatado,
      valor: String(converterMoedaParaNumero(valorFormatado))
    })
  }

  const handleValorEditarPagamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setEditarPagamentoForm({
      ...editarPagamentoForm,
      valorFormatado,
      valor: String(converterMoedaParaNumero(valorFormatado))
    })
  }

  const validarNovoPagamento = (): boolean => {
    if (!novoPagamentoForm.data) {
      toast.error("Informe a data do pagamento")
      return false
    }
    const valorNumerico = Number(novoPagamentoForm.valor ?? 0)
    if (!valorNumerico || valorNumerico <= 0) {
      toast.error("Informe um valor válido maior que zero")
      return false
    }
    return true
  }

  const validarEditarPagamento = (): boolean => {
    if (!editarPagamentoForm.data) {
      toast.error("Informe a data do pagamento")
      return false
    }
    const valorNumerico = Number(editarPagamentoForm.valor ?? 0)
    if (!valorNumerico || valorNumerico <= 0) {
      toast.error("Informe um valor válido maior que zero")
      return false
    }
    return true
  }

  const handleSalvarNovoPagamento = async () => {
    if (!validarNovoPagamento()) return
    if (!profissional) return

    try {
      const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")

      const novaDespesa: Despesa = {
        id: `desp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        obraId: profissional.obraId,
        data: novoPagamentoForm.data,
        valor: Number(novoPagamentoForm.valor),
        categoria: "Mão de Obra",
        category: "mao_obra",
        descricao: `Pagamento - ${profissional.nome}`,
        formaPagamento: novoPagamentoForm.formaPagamento,
        observacao: novoPagamentoForm.observacao || undefined,
        profissionalId: profissional.id
      }

      todasDespesas.push(novaDespesa)
      localStorage.setItem("despesas", JSON.stringify(todasDespesas))

      // Disparar evento customizado para atualizar outras páginas
      window.dispatchEvent(new CustomEvent("pagamentoSalvo", { detail: { profissionalId: profissional.id } }))

      carregarPagamentos()
      setModalNovoPagamento(false)
      toast.success("Pagamento registrado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error)
      toast.error("Erro ao salvar pagamento")
    }
  }

  const handleSalvarEditarPagamento = async () => {
    if (!validarEditarPagamento()) return
    if (!profissional || !pagamentoEditando) return

    try {
      const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
      const index = todasDespesas.findIndex((d: Despesa) => d.id === pagamentoEditando)
      
      if (index === -1) throw new Error("Pagamento não encontrado")

      todasDespesas[index] = {
        ...todasDespesas[index],
        data: editarPagamentoForm.data,
        valor: Number(editarPagamentoForm.valor),
        formaPagamento: editarPagamentoForm.formaPagamento,
        observacao: editarPagamentoForm.observacao || undefined
      }

      localStorage.setItem("despesas", JSON.stringify(todasDespesas))

      // Disparar evento customizado para atualizar outras páginas
      window.dispatchEvent(new CustomEvent("pagamentoAtualizado", { detail: { profissionalId: profissional.id } }))

      carregarPagamentos()
      setModalEditarPagamento(false)
      setPagamentoEditando(null)
      toast.success("Pagamento atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
      toast.error("Erro ao atualizar pagamento")
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

  const valorPago = calcularValorPago()
  const valorPrevisto = calcularValorPrevisto()
  const saldoPagar = calcularSaldoPagar()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
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

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 italic">
                      💡 Se houver alteração de escopo ou reorçamento, você pode ajustar este contrato pelo botão Editar.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleOpenDeleteContratoModal}
                      disabled={excluindoContrato}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <Trash2 className={`w-4 h-4 mr-2 ${excluindoContrato ? 'animate-pulse' : ''}`} />
                      {excluindoContrato ? "Excluindo..." : "Excluir contrato/combinado"}
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
                onClick={handleAbrirModalNovoPagamento}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </div>

            {pagamentos.length > 0 ? (
              <div className="space-y-4">
                {pagamentos
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((pagamento) => (
                  <div 
                    key={pagamento.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${
                      excluindoPagamento === pagamento.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{formatarMoeda(pagamento.valor)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(pagamento.data).toLocaleDateString('pt-BR')} - {pagamento.formaPagamento || "Não informado"}
                      </p>
                      {pagamento.observacao && (
                        <p className="text-sm text-gray-600 mt-1">{pagamento.observacao}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAbrirModalEditarPagamento(pagamento)}
                        disabled={excluindoPagamento === pagamento.id}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDeletePagamentoModal(pagamento)}
                        disabled={excluindoPagamento === pagamento.id}
                        className="border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Trash2 className={`w-4 h-4 ${excluindoPagamento === pagamento.id ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
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

      {/* Modal Novo Pagamento */}
      {modalNovoPagamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Novo Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={novoPagamentoForm.data}
                  onChange={(e) => setNovoPagamentoForm({...novoPagamentoForm, data: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="valorPagamento">Valor</Label>
                <Input
                  id="valorPagamento"
                  type="text"
                  value={novoPagamentoForm.valorFormatado}
                  onChange={handleValorPagamentoChange}
                  placeholder="R$ 0,00"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select
                  value={novoPagamentoForm.formaPagamento}
                  onValueChange={(value) => setNovoPagamentoForm({...novoPagamentoForm, formaPagamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observacaoPagamento">Observação (opcional)</Label>
                <Textarea
                  id="observacaoPagamento"
                  value={novoPagamentoForm.observacao}
                  onChange={(e) => setNovoPagamentoForm({...novoPagamentoForm, observacao: e.target.value})}
                  rows={3}
                  placeholder="Ex: Pagamento referente à primeira etapa"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSalvarNovoPagamento}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar pagamento
                </Button>
                <Button 
                  onClick={() => setModalNovoPagamento(false)}
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pagamento */}
      {modalEditarPagamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataEditarPagamento">Data do Pagamento</Label>
                <Input
                  id="dataEditarPagamento"
                  type="date"
                  value={editarPagamentoForm.data}
                  onChange={(e) => setEditarPagamentoForm({...editarPagamentoForm, data: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="valorEditarPagamento">Valor</Label>
                <Input
                  id="valorEditarPagamento"
                  type="text"
                  value={editarPagamentoForm.valorFormatado}
                  onChange={handleValorEditarPagamentoChange}
                  placeholder="R$ 0,00"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <Label htmlFor="formaEditarPagamento">Forma de Pagamento</Label>
                <Select
                  value={editarPagamentoForm.formaPagamento}
                  onValueChange={(value) => setEditarPagamentoForm({...editarPagamentoForm, formaPagamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observacaoEditarPagamento">Observação (opcional)</Label>
                <Textarea
                  id="observacaoEditarPagamento"
                  value={editarPagamentoForm.observacao}
                  onChange={(e) => setEditarPagamentoForm({...editarPagamentoForm, observacao: e.target.value})}
                  rows={3}
                  placeholder="Ex: Pagamento referente à primeira etapa"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSalvarEditarPagamento}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar alterações
                </Button>
                <Button 
                  onClick={() => {
                    setModalEditarPagamento(false)
                    setPagamentoEditando(null)
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de contrato */}
      {showDeleteContratoModal && profissional.contrato && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {/* Ícone de alerta */}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Excluir contrato?
            </h2>

            {/* Detalhes do contrato */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="font-semibold text-gray-900">
                    {profissional.contrato.tipoContrato === "empreitada" ? "Empreitada" :
                     profissional.contrato.tipoContrato === "diaria" ? "Diária" :
                     profissional.contrato.tipoContrato === "por_m2" ? "Por m²" :
                     profissional.contrato.tipoContrato === "por_unidade" ? "Por unidade" :
                     profissional.contrato.tipoContrato === "por_etapa" ? "Por etapa" : profissional.contrato.tipoContrato}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valor Previsto</p>
                  <p className="font-semibold text-gray-900">{formatarMoeda(profissional.contrato.valorPrevisto)}</p>
                </div>
              </div>
            </div>

            {/* Texto de aviso */}
            <p className="text-gray-600 text-center mb-6">
              Esta ação é permanente e removerá todas as informações do contrato.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteContratoModal}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                disabled={excluindoContrato}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteContrato}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={excluindoContrato}
              >
                {excluindoContrato ? (
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

      {/* Modal de confirmação de exclusão de pagamento */}
      {showDeletePagamentoModal && pagamentoToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {/* Ícone de alerta */}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Excluir pagamento?
            </h2>

            {/* Detalhes do pagamento */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="font-semibold text-gray-900">{formatarMoeda(pagamentoToDelete.valor)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(pagamentoToDelete.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              {pagamentoToDelete.formaPagamento && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">Forma de Pagamento</p>
                  <p className="font-semibold text-gray-900">{pagamentoToDelete.formaPagamento}</p>
                </div>
              )}
            </div>

            {/* Texto de aviso */}
            <p className="text-gray-600 text-center mb-6">
              Esta ação é permanente e não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeletePagamentoModal}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                disabled={excluindoPagamento !== null}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeletePagamento}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={excluindoPagamento !== null}
              >
                {excluindoPagamento ? (
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
