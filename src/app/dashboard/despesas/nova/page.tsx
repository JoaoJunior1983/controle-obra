"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Calendar, DollarSign, FileText, CreditCard, User, MessageSquare, Plus, CheckCircle2, Home } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"

const CATEGORIAS = ["material", "mao_obra", "outros"]

const FORMAS_PAGAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão",
  "Boleto",
  "Transferência"
]

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
}

// Função para formatar valor monetário brasileiro
const formatarMoeda = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, "")
  if (!apenasNumeros) return ""
  const numero = parseFloat(apenasNumeros) / 100
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const removerFormatacao = (valorFormatado: string): number => {
  const apenasNumeros = valorFormatado.replace(/\D/g, "")
  return parseFloat(apenasNumeros) / 100
}

export default function NovaDespesaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [obraId, setObraId] = useState("")
  const [valorFormatado, setValorFormatado] = useState("")
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const primeiroInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    category: "", // Novo campo obrigatório
    descricao: "",
    valor: "",
    formaPagamento: "",
    fornecedor: "",
    professionalId: "", // Campo padronizado
    observacoes: ""
  })

  useEffect(() => {
    // Verificar autenticação e carregar obra
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
    const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
    const obrasDoUsuario = obrasExistentes.filter((o: any) => o.userId === user.email)
    
    if (obrasDoUsuario.length > 0) {
      const obraMaisRecente = obrasDoUsuario[obrasDoUsuario.length - 1]
      setObraId(obraMaisRecente.id)

      // Carregar profissionais da obra
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const profissionaisObra = todosProfissionais.filter((p: Profissional) => p.obraId === obraMaisRecente.id)
      setProfissionais(profissionaisObra)
    } else {
      router.push("/dashboard/criar-obra")
    }
  }, [router])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setValorFormatado(valorFormatado)
    
    const valorNumerico = removerFormatacao(valorFormatado)
    setFormData({ ...formData, valor: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleProfissionalChange = (value: string) => {
    if (value === "__new__") {
      // Redirecionar para cadastro de novo profissional
      router.push("/dashboard/profissionais/novo")
    } else if (value === "__none__") {
      // Limpar seleção
      setFormData({ ...formData, professionalId: "", fornecedor: "" })
    } else {
      // REGRA CRÍTICA: Se selecionar profissional, categoria DEVE ser "mao_obra"
      setFormData({ ...formData, professionalId: value, category: "mao_obra" })
      
      // Preencher automaticamente o campo fornecedor com o nome do profissional
      const profissional = profissionais.find(p => p.id === value)
      if (profissional) {
        setFormData(prev => ({ ...prev, professionalId: value, category: "mao_obra", fornecedor: profissional.nome }))
      }
    }
  }

  const limparFormulario = () => {
    setFormData({
      data: new Date().toISOString().split("T")[0],
      category: "",
      descricao: "",
      valor: "",
      formaPagamento: "",
      fornecedor: "",
      professionalId: "",
      observacoes: ""
    })
    setValorFormatado("")
    setSuccess(false)
    setLoading(false)
    
    // Focar no primeiro campo
    setTimeout(() => {
      primeiroInputRef.current?.focus()
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!formData.data || !formData.category || !formData.valor || parseFloat(formData.valor) <= 0) {
        alert("Por favor, preencha todos os campos obrigatórios (Data, Categoria e Valor)")
        setLoading(false)
        return
      }

      // REGRA CRÍTICA: Se tem professionalId, categoria DEVE ser "mao_obra"
      const categoryFinal = formData.professionalId ? "mao_obra" : formData.category

      // Buscar nome do profissional se houver
      let descricaoFinal = formData.descricao
      if (formData.professionalId && !descricaoFinal) {
        const profissional = profissionais.find(p => p.id === formData.professionalId)
        if (profissional) {
          descricaoFinal = `Pagamento - ${profissional.nome}`
        }
      }

      // Criar objeto da despesa com campos padronizados para sincronização
      const despesa = {
        id: Date.now().toString(),
        obraId: obraId,
        data: formData.data,
        category: categoryFinal,
        categoria: categoryFinal, // Duplicar para compatibilidade
        descricao: descricaoFinal,
        valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento,
        fornecedor: formData.fornecedor || undefined,
        professionalId: formData.professionalId || undefined, // Campo padronizado
        profissionalId: formData.professionalId || undefined, // Duplicar para compatibilidade
        observacoes: formData.observacoes || undefined,
        observacao: formData.observacoes || undefined // Duplicar para compatibilidade com pagamentos
      }

      console.log("Salvando despesa:", despesa)

      // Salvar no localStorage
      const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
      despesasExistentes.push(despesa)
      localStorage.setItem("despesas", JSON.stringify(despesasExistentes))

      console.log("Total de despesas após salvar:", despesasExistentes.length)

      // Se houver profissional vinculado, disparar evento para atualizar lista de profissionais
      if (formData.professionalId) {
        window.dispatchEvent(new CustomEvent("pagamentoSalvo", { 
          detail: { profissionalId: formData.professionalId } 
        }))
      }

      // Mostrar mensagem de sucesso
      toast.success("Despesa salva com sucesso!")

      // Marcar como sucesso e desbloquear botões
      setSuccess(true)
      setLoading(false)

    } catch (error) {
      console.error("Erro ao salvar despesa:", error)
      toast.error("Erro ao salvar despesa. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
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
            onClick={() => router.push("/dashboard/despesas")}
            className="mb-4 hover:bg-blue-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Despesas
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Nova Despesa
              </h1>
              <p className="text-sm text-gray-500">
                Registre uma nova despesa da obra
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <Card className="p-6 mb-6 bg-green-50 border-green-200 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  Despesa salva com sucesso!
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  A despesa foi registrada e já está disponível na listagem.
                </p>
                
                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={limparFormulario}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Lançar nova despesa
                  </Button>
                  <Button
                    onClick={() => goToObraDashboard(router, obraId)}
                    variant="outline"
                    className="flex-1 border-green-300 hover:bg-green-50 text-green-700"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Voltar ao dashboard
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Formulário */}
        {!success && (
          <form onSubmit={handleSubmit}>
            <Card className="p-6 sm:p-8 bg-white shadow-lg space-y-6">
              {/* Data e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data *
                  </Label>
                  <Input
                    ref={primeiroInputRef}
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>

                {/* Categoria (NOVO CAMPO OBRIGATÓRIO) */}
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-sm text-gray-600 font-medium">
                    Categoria *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                    disabled={!!formData.professionalId} // Desabilitar se profissional selecionado
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="mao_obra">Mão de obra</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.professionalId && (
                    <p className="text-xs text-blue-600">
                      Categoria definida automaticamente como "Mão de obra" ao vincular profissional
                    </p>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descrição
                </Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra de cimento para fundação"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              {/* Valor e Forma de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      R$
                    </span>
                    <Input
                      id="valor"
                      type="text"
                      placeholder="0,00"
                      value={valorFormatado}
                      onChange={handleValorChange}
                      required
                      className="pl-12 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-2">
                  <Label htmlFor="formaPagamento" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Forma de Pagamento
                  </Label>
                  <Select
                    value={formData.formaPagamento}
                    onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((forma) => (
                        <SelectItem key={forma} value={forma}>
                          {forma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Profissional (CONDICIONAL - só aparece se categoria = "mao_obra") */}
              {formData.category === "mao_obra" && (
                <div className="space-y-2">
                  <Label htmlFor="profissional" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profissional (opcional)
                  </Label>
                  {profissionais.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Nenhum profissional cadastrado ainda. 
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/profissionais/novo")}
                          className="ml-1 text-blue-600 hover:underline font-semibold"
                        >
                          Cadastrar agora
                        </button>
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={formData.professionalId}
                      onValueChange={handleProfissionalChange}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Selecione um profissional (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem profissional</SelectItem>
                        {profissionais
                          .filter(p => p?.id && String(p.id).trim().length > 0)
                          .map((profissional) => (
                            <SelectItem key={profissional.id} value={String(profissional.id)}>
                              {profissional.nome} - {profissional.funcao}
                            </SelectItem>
                          ))}
                        <SelectItem value="__new__" className="text-blue-600 font-semibold border-t mt-2 pt-2">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            + Cadastrar novo profissional
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Fornecedor (campo texto alternativo - só aparece se NÃO for mão de obra OU se não tiver profissional selecionado) */}
              {(formData.category !== "mao_obra" || !formData.professionalId) && (
                <div className="space-y-2">
                  <Label htmlFor="fornecedor" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome do Fornecedor (opcional)
                  </Label>
                  <Input
                    id="fornecedor"
                    placeholder="Ex: Loja de Materiais XYZ"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Observações (opcional)
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre esta despesa..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Anexar Comprovante (Placeholder) */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 font-medium">
                  Anexar Comprovante (em breve)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Funcionalidade de upload de comprovantes será implementada em breve
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/despesas")}
                  className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700"
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar despesa"}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}
