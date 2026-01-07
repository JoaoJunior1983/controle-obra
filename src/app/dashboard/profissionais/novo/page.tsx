"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, User, Briefcase, Phone, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"

const FUNCOES = [
  "Pedreiro",
  "Eletricista",
  "Encanador",
  "Azulejista",
  "Pintor",
  "Gesseiro",
  "Marceneiro",
  "Engenheiro",
  "Arquiteto",
  "Outros"
]

export default function NovoProfissionalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [obraId, setObraId] = useState("")
  
  const [formData, setFormData] = useState({
    nome: "",
    funcao: "",
    telefone: "",
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
    } else {
      router.push("/dashboard/criar-obra")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!formData.nome || !formData.funcao) {
        alert("Por favor, preencha o nome e a função do profissional")
        setLoading(false)
        return
      }

      // Criar objeto do profissional
      const profissional = {
        id: Date.now().toString(),
        obraId: obraId,
        nome: formData.nome,
        funcao: formData.funcao,
        telefone: formData.telefone || undefined,
        observacoes: formData.observacoes || undefined,
        pagamentos: [],
        extras: []
      }

      // Salvar no localStorage
      const profissionaisExistentes = JSON.parse(localStorage.getItem("profissionais") || "[]")
      profissionaisExistentes.push(profissional)
      localStorage.setItem("profissionais", JSON.stringify(profissionaisExistentes))

      // Mostrar mensagem de sucesso
      toast.success("Profissional cadastrado com sucesso!")

      // Redirecionar para detalhe do profissional
      setTimeout(() => {
        router.push(`/dashboard/profissionais/${profissional.id}`)
      }, 800)

    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
      alert("Erro ao salvar profissional. Tente novamente.")
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
            onClick={() => router.push("/dashboard/profissionais")}
            className="mb-4 hover:bg-blue-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Profissionais
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Novo Profissional
              </h1>
              <p className="text-sm text-gray-500">
                Cadastre um novo profissional da obra
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6 sm:p-8 bg-white shadow-lg space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome do Profissional *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Função */}
            <div className="space-y-2">
              <Label htmlFor="funcao" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Função *
              </Label>
              <Select
                value={formData.funcao}
                onValueChange={(value) => setFormData({ ...formData, funcao: value })}
                required
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {FUNCOES.map((funcao) => (
                    <SelectItem key={funcao} value={funcao}>
                      {funcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone / WhatsApp (opcional)
              </Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observações (opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o profissional..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="border-gray-300 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/profissionais")}
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
                {loading ? "Salvando..." : "Salvar profissional"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
