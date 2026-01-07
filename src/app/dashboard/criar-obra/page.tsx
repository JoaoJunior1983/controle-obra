"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

// Função para formatar valor monetário brasileiro
const formatarMoeda = (valor: string): string => {
  // Remove tudo que não é dígito
  const apenasNumeros = valor.replace(/\D/g, "")
  
  if (!apenasNumeros) return ""
  
  // Converte para número e divide por 100 para ter os centavos
  const numero = parseFloat(apenasNumeros) / 100
  
  // Formata com separadores brasileiros
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Função para remover formatação e obter valor numérico
const removerFormatacao = (valorFormatado: string): number => {
  const apenasNumeros = valorFormatado.replace(/\D/g, "")
  return parseFloat(apenasNumeros) / 100
}

// Função para formatar área com máscara decimal automática
const formatarArea = (valor: string): string => {
  // Remove tudo que não é dígito
  const apenasNumeros = valor.replace(/\D/g, "")
  
  if (!apenasNumeros) return ""
  
  // Converte para número e divide por 100 para ter os centavos (2 casas decimais)
  const numero = parseFloat(apenasNumeros) / 100
  
  // Formata com separadores brasileiros (ponto para milhar, vírgula para decimal)
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Função para converter área formatada em número
const areaParaNumero = (areaFormatada: string): number => {
  // Remove tudo que não é dígito
  const apenasNumeros = areaFormatada.replace(/\D/g, "")
  if (!apenasNumeros) return 0
  // Divide por 100 para obter o valor decimal correto
  return parseFloat(apenasNumeros) / 100
}

export default function CriarObraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    area: "",
    estado: "",
    cidade: "",
    bairro: "",
    orcamento: "",
    dataInicio: "",
    dataTermino: ""
  })
  const [orcamentoFormatado, setOrcamentoFormatado] = useState("")
  const [areaFormatada, setAreaFormatada] = useState("")

  const handleOrcamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setOrcamentoFormatado(valorFormatado)
    
    // Salva o valor numérico sem formatação no formData
    const valorNumerico = removerFormatacao(valorFormatado)
    setFormData({ ...formData, orcamento: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarArea(valorDigitado)
    setAreaFormatada(valorFormatado)
    
    // Salva o valor numérico no formData
    const valorNumerico = areaParaNumero(valorFormatado)
    setFormData({ ...formData, area: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.nome || !formData.tipo || !formData.area || !formData.estado || !formData.cidade || !formData.bairro) {
        alert("Por favor, preencha todos os campos obrigatórios")
        setLoading(false)
        return
      }

      // Obter usuário logado
      const userData = localStorage.getItem("user")
      if (!userData) {
        alert("Usuário não autenticado")
        router.push("/")
        return
      }

      const user = JSON.parse(userData)

      // Criar objeto da obra
      const obra = {
        id: Date.now().toString(),
        userId: user.email,
        nome: formData.nome,
        tipo: formData.tipo,
        area: parseFloat(formData.area),
        localizacao: {
          estado: formData.estado,
          cidade: formData.cidade,
          bairro: formData.bairro
        },
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        dataInicio: formData.dataInicio || null,
        dataTermino: formData.dataTermino || null,
        criadaEm: new Date().toISOString()
      }

      // Salvar no localStorage (simulação)
      const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
      obrasExistentes.push(obra)
      localStorage.setItem("obras", JSON.stringify(obrasExistentes))

      // Redirecionar para dashboard da obra
      setTimeout(() => {
        router.push("/dashboard/obra")
      }, 500)

    } catch (error) {
      console.error("Erro ao criar obra:", error)
      alert("Erro ao criar obra. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
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
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Criar Nova Obra
            </h1>
          </div>
          <p className="text-base text-gray-500 ml-15">
            Preencha os dados da sua obra para começar
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Marca d'água sutil OBREASY */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] hidden sm:flex"
            style={{
              backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/979b9040-0d37-4e0d-ae77-88fcfe603d77.png')`,
              backgroundSize: '400px 400px',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />

          {/* Dados da Obra */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-blue-100">
              Dados da Obra
            </h3>

            {/* Nome da Obra */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm text-gray-600 font-medium">
                Nome da Obra *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Casa da Praia, Reforma Apartamento Centro"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm text-gray-600 font-medium">
                Tipo *
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                required
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construcao">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Construção
                    </div>
                  </SelectItem>
                  <SelectItem value="reforma">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Reforma
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Área */}
            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm text-gray-600 font-medium">
                Área em m² *
              </Label>
              <Input
                id="area"
                type="text"
                placeholder="Ex: 1.020,50"
                value={areaFormatada}
                onChange={handleAreaChange}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-blue-100">
              Localização
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-sm text-gray-600 font-medium">
                  Estado *
                </Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  required
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASILEIROS.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cidade */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cidade" className="text-sm text-gray-600 font-medium">
                  Cidade *
                </Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-sm text-gray-600 font-medium">
                Bairro *
              </Label>
              <Input
                id="bairro"
                placeholder="Ex: Jardins"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Orçamento Estimado */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-blue-100">
              Orçamento Estimado
            </h3>

            <div className="space-y-2">
              <Label htmlFor="orcamento" className="text-sm text-gray-600 font-medium">
                Orçamento Estimado (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  R$
                </span>
                <Input
                  id="orcamento"
                  type="text"
                  placeholder="0,00"
                  value={orcamentoFormatado}
                  onChange={handleOrcamentoChange}
                  className="pl-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Esse valor será usado para calcular economia, alertas e custo por m².
              </p>
            </div>
          </div>

          {/* Prazo da Obra */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-blue-100">
              Prazo da Obra
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data de Início */}
              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="text-sm text-gray-600 font-medium">
                  Data de Início (opcional)
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Previsão de Término */}
              <div className="space-y-2">
                <Label htmlFor="dataTermino" className="text-sm text-gray-600 font-medium">
                  Previsão de Término (opcional)
                </Label>
                <Input
                  id="dataTermino"
                  type="date"
                  value={formData.dataTermino}
                  onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 relative z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Criar Obra"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
