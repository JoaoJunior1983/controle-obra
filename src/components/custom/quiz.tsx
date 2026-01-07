"use client"

import { useState, useMemo } from "react"
import { ArrowRight, ArrowLeft, CheckCircle2, TrendingUp, Wallet, Building2, Check, ChevronDown } from "lucide-react"
import Image from "next/image"

// Base COMPLETA de Estados do Brasil
const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
].sort()

interface QuizData {
  tipoObra: string
  possuiProjeto: string
  estado: string
  cidade: string
  bairro: string
  area: string
  orcamento: string
  preocupacoes: string[]
}

interface QuizProps {
  onClose: () => void
  onComplete: (data: QuizData) => void
}

export default function Quiz({ onClose, onComplete }: QuizProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [quizData, setQuizData] = useState<QuizData>({
    tipoObra: "",
    possuiProjeto: "",
    estado: "",
    cidade: "",
    bairro: "",
    area: "",
    orcamento: "",
    preocupacoes: []
  })
  const [showResults, setShowResults] = useState(false)
  const [estadoSearch, setEstadoSearch] = useState("")
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false)

  const totalSteps = 6
  const progress = ((currentStep + 1) / totalSteps) * 100

  const updateData = (field: keyof QuizData, value: string | string[]) => {
    setQuizData(prev => ({ ...prev, [field]: value }))
  }

  // Filtrar estados baseado na busca
  const filteredEstados = useMemo(() => {
    if (!estadoSearch) return ESTADOS
    return ESTADOS.filter(estado => 
      estado.toLowerCase().includes(estadoSearch.toLowerCase())
    )
  }, [estadoSearch])

  const handleEstadoSelect = (estado: string) => {
    updateData("estado", estado)
    updateData("cidade", "") // Limpa cidade ao mudar estado
    setEstadoSearch(estado)
    setShowEstadoDropdown(false)
  }

  const formatCurrency = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '')
    
    // Converte para número e formata
    const numberValue = parseInt(numbers) || 0
    
    return numberValue.toLocaleString('pt-BR')
  }

  const handleOrcamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatCurrency(value)
    updateData("orcamento", formatted)
  }

  const togglePreocupacao = (option: string) => {
    if (option === "Todas as alternativas") {
      // Se "Todas" for selecionada, seleciona/deseleciona todas
      if (quizData.preocupacoes.includes("Todas as alternativas")) {
        updateData("preocupacoes", [])
      } else {
        updateData("preocupacoes", [
          "Controlar os gastos",
          "Evitar atrasos",
          "Qualidade dos materiais",
          "Confiança nos profissionais",
          "Organização geral",
          "Todas as alternativas"
        ])
      }
    } else {
      // Lógica normal de toggle
      const current = quizData.preocupacoes.filter(p => p !== "Todas as alternativas")
      if (current.includes(option)) {
        updateData("preocupacoes", current.filter(p => p !== option))
      } else {
        const newPreocupacoes = [...current, option]
        // Se todas as opções individuais estão selecionadas, adiciona "Todas"
        if (newPreocupacoes.length === 5) {
          updateData("preocupacoes", [...newPreocupacoes, "Todas as alternativas"])
        } else {
          updateData("preocupacoes", newPreocupacoes)
        }
      }
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return quizData.tipoObra !== ""
      case 1: return quizData.possuiProjeto !== ""
      case 2: return quizData.estado !== "" && quizData.cidade !== ""
      case 3: return quizData.area !== ""
      case 4: return true // Orçamento é opcional
      case 5: return true // Preocupação é opcional
      default: return false
    }
  }

  const calculateEconomy = () => {
    const area = parseFloat(quizData.area) || 50
    const orcamentoString = quizData.orcamento.replace(/\D/g, '')
    const orcamento = parseFloat(orcamentoString) || area * 2000
    const economiaPercentual = 20
    const economiaValor = orcamento * (economiaPercentual / 100)
    
    return {
      orcamento,
      economiaPercentual,
      economiaValor,
      area
    }
  }

  const handlePlantaBaixaClick = () => {
    // Salva dados do quiz no localStorage
    localStorage.setItem("quizData", JSON.stringify(quizData))
    localStorage.setItem("needsPlantaBaixa", "true")
    
    // Fecha o quiz e abre o modal de autenticação
    onComplete(quizData)
  }

  // Tela de resultados
  if (showResults) {
    const { orcamento, economiaPercentual, economiaValor, area } = calculateEconomy()

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-blue-50/60 via-slate-50/40 to-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
          {/* Logo OBREASY como marca d'água em AZUL com maior opacidade */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
              alt=""
              width={600}
              height={600}
              className="opacity-[0.07] scale-125"
              style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(180deg) brightness(0.6)' }}
            />
          </div>

          <div className="p-8 sm:p-12 relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 mb-4">
                Com organização e controle, você pode economizar até
              </h2>
              <div className="text-5xl sm:text-6xl font-poppins font-bold text-emerald-600 mb-2">
                {economiaPercentual}%
              </div>
              <p className="text-lg text-gray-600 font-inter">
                na sua obra
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-white rounded-xl p-5 text-center border border-gray-200 shadow-sm">
                <Building2 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-inter mb-1">Área da obra</p>
                <p className="text-xl font-poppins font-bold text-gray-900">{area}m²</p>
              </div>
              <div className="bg-white rounded-xl p-5 text-center border border-gray-200 shadow-sm">
                <Wallet className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-inter mb-1">Orçamento</p>
                <p className="text-xl font-poppins font-bold text-gray-900">
                  R$ {orcamento.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 text-center border border-gray-200 shadow-sm">
                <TrendingUp className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-inter mb-1">Economia</p>
                <p className="text-xl font-poppins font-bold text-emerald-600">
                  R$ {economiaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white rounded-xl p-6 mb-8 border border-blue-200 shadow-sm">
              <h3 className="font-poppins font-bold text-gray-900 text-lg mb-3">
                Como você pode alcançar essa economia?
              </h3>
              <ul className="space-y-3 text-gray-700 font-inter">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Controle financeiro rigoroso:</strong> Evite desperdícios e compras desnecessárias</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Organização de fases:</strong> Planeje cada etapa e evite retrabalho</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Transparência com profissionais:</strong> Acompanhe contratos e pagamentos</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Registro completo:</strong> Documente tudo e tome decisões baseadas em dados</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <button
                onClick={() => onComplete(quizData)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-inter font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Criar conta para salvar sua simulação
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="w-full bg-white text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all font-inter font-medium text-base border border-gray-300"
              >
                Voltar para o início
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-blue-50/60 via-slate-50/40 to-white rounded-2xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Logo OBREASY como marca d'água em AZUL com maior opacidade */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
          <Image
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
            alt=""
            width={600}
            height={600}
            className="opacity-[0.07] scale-125"
            style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(180deg) brightness(0.6)' }}
          />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 sm:p-12 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 font-inter mb-2">
              Pergunta {currentStep + 1} de {totalSteps}
            </p>
            <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-gray-900">
              {currentStep === 0 && "Qual o tipo da sua obra?"}
              {currentStep === 1 && "Você já possui um projeto?"}
              {currentStep === 2 && "Onde será a obra?"}
              {currentStep === 3 && "Qual a área aproximada?"}
              {currentStep === 4 && "Qual o orçamento estimado?"}
              {currentStep === 5 && "Qual sua principal preocupação?"}
            </h2>
            {currentStep === 4 && (
              <p className="text-gray-500 font-inter mt-2 text-sm">Opcional - pode pular esta pergunta</p>
            )}
            {currentStep === 5 && (
              <p className="text-gray-500 font-inter mt-2 text-sm">Opcional - pode selecionar múltiplas opções</p>
            )}
          </div>

          {/* Question Content */}
          <div className="mb-10">
            {/* Question 1: Tipo de Obra */}
            {currentStep === 0 && (
              <div className="space-y-3">
                {["Construção nova", "Reforma"].map((option) => (
                  <button
                    key={option}
                    onClick={() => updateData("tipoObra", option)}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left font-inter ${
                      quizData.tipoObra === option
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{option}</span>
                      {quizData.tipoObra === option && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Question 2: Possui Projeto */}
            {currentStep === 1 && (
              <div className="space-y-3">
                {[
                  { value: "Sim", label: "Sim" },
                  { value: "Não", label: "Não, preciso criar meu projeto" }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateData("possuiProjeto", option.value)}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left font-inter ${
                      quizData.possuiProjeto === option.value
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      {quizData.possuiProjeto === option.value && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Question 3: Localização */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Estado com Autocomplete */}
                <div className="relative">
                  <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                    Estado (UF) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={estadoSearch}
                      onChange={(e) => {
                        setEstadoSearch(e.target.value)
                        setShowEstadoDropdown(true)
                      }}
                      onFocus={() => setShowEstadoDropdown(true)}
                      placeholder="Digite ou selecione o estado"
                      className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none font-inter transition-colors bg-white"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {showEstadoDropdown && filteredEstados.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredEstados.map((estado) => (
                        <button
                          key={estado}
                          onClick={() => handleEstadoSelect(estado)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors font-inter text-gray-900 border-b border-gray-100 last:border-b-0"
                        >
                          {estado}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cidade - CAMPO MANUAL */}
                <div>
                  <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={quizData.cidade}
                    onChange={(e) => updateData("cidade", e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none font-inter transition-colors bg-white"
                  />
                </div>

                {/* Bairro (opcional) */}
                <div>
                  <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                    Bairro (opcional)
                  </label>
                  <input
                    type="text"
                    value={quizData.bairro}
                    onChange={(e) => updateData("bairro", e.target.value)}
                    placeholder="Ex: Vila Mariana"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none font-inter transition-colors bg-white"
                  />
                </div>
              </div>
            )}

            {/* Question 4: Área */}
            {currentStep === 3 && (
              <div>
                <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                  Área em metros quadrados (m²)
                </label>
                <input
                  type="number"
                  value={quizData.area}
                  onChange={(e) => updateData("area", e.target.value)}
                  placeholder="Ex: 80"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none font-inter text-lg transition-colors bg-white"
                />
                <p className="text-sm text-gray-500 font-inter mt-2">
                  Se não souber exatamente, coloque um valor aproximado
                </p>
              </div>
            )}

            {/* Question 5: Orçamento */}
            {currentStep === 4 && (
              <div>
                <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                  Orçamento total estimado
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-inter text-lg">
                    R$
                  </span>
                  <input
                    type="text"
                    value={quizData.orcamento}
                    onChange={handleOrcamentoChange}
                    placeholder="150.000"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none font-inter text-lg transition-colors bg-white"
                  />
                </div>
                <p className="text-sm text-gray-500 font-inter mt-2">
                  Incluindo materiais e mão de obra
                </p>
              </div>
            )}

            {/* Question 6: Preocupação (múltipla escolha) */}
            {currentStep === 5 && (
              <div className="space-y-3">
                {[
                  "Controlar os gastos",
                  "Evitar atrasos",
                  "Qualidade dos materiais",
                  "Confiança nos profissionais",
                  "Organização geral",
                  "Todas as alternativas"
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => togglePreocupacao(option)}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left font-inter ${
                      quizData.preocupacoes.includes(option)
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${option === "Todas as alternativas" ? "text-blue-600" : "text-gray-900"}`}>
                        {option}
                      </span>
                      {quizData.preocupacoes.includes(option) && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all font-inter font-medium flex items-center gap-2 bg-white"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            
            {/* Botão especial para quando seleciona "Não" na pergunta 2 */}
            {currentStep === 1 && quizData.possuiProjeto === "Não" ? (
              <button
                onClick={handlePlantaBaixaClick}
                className="flex-1 px-6 py-3 rounded-xl transition-all font-inter font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
              >
                Quero criar uma planta baixa simples
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex-1 px-6 py-3 rounded-xl transition-all font-inter font-semibold flex items-center justify-center gap-2 ${
                  canProceed()
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {currentStep === totalSteps - 1 ? "Ver resultado" : "Continuar"}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors font-inter text-sm"
          >
            Fechar quiz
          </button>
        </div>
      </div>
    </div>
  )
}
