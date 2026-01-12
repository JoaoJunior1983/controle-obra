"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Plus, MapPin, TrendingUp, Wallet, PiggyBank, Home, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getObrasDoUsuario, setActiveObraId, calcularMetricasObra, deleteObraCascade, type Obra } from "@/lib/storage"
import Image from "next/image"

export default function ObrasPage() {
  const router = useRouter()
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingObraId, setDeletingObraId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null)

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Carregar obras do usuário
    const obrasDoUsuario = getObrasDoUsuario()
    setObras(obrasDoUsuario)
    setLoading(false)

    // Regra: Se tiver apenas 1 obra, redirecionar automaticamente
    if (obrasDoUsuario.length === 1) {
      setActiveObraId(obrasDoUsuario[0].id)
      router.push("/dashboard/obra")
    }
  }, [router])

  const handleSelecionarObra = (obraId: string) => {
    setActiveObraId(obraId)
    router.push("/dashboard/obra")
  }

  const handleCriarObra = () => {
    router.push("/dashboard/criar-obra")
  }

  const handleOpenDeleteModal = (e: React.MouseEvent, obra: Obra) => {
    e.stopPropagation()
    setObraToDelete(obra)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setObraToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!obraToDelete) return

    setDeletingObraId(obraToDelete.id)

    try {
      const success = deleteObraCascade(obraToDelete.id)
      
      if (success) {
        // Atualizar lista de obras
        const obrasAtualizadas = obras.filter(o => o.id !== obraToDelete.id)
        setObras(obrasAtualizadas)

        // Fechar modal
        handleCloseDeleteModal()

        // Mostrar feedback de sucesso
        const event = new CustomEvent("show-toast", {
          detail: {
            type: "success",
            message: "Obra excluída com sucesso"
          }
        })
        window.dispatchEvent(event)

        // Se não houver mais obras, recarregar a página para mostrar estado vazio
        if (obrasAtualizadas.length === 0) {
          router.refresh()
        }
      } else {
        throw new Error("Falha ao excluir obra")
      }
    } catch (error) {
      console.error("Erro ao excluir obra:", error)
      const event = new CustomEvent("show-toast", {
        detail: {
          type: "error",
          message: "Erro ao excluir obra. Tente novamente."
        }
      })
      window.dispatchEvent(event)
    } finally {
      setDeletingObraId(null)
    }
  }

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas obras...</p>
        </div>
      </div>
    )
  }

  // Estado vazio: nenhuma obra cadastrada
  if (obras.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/979b9040-0d37-4e0d-ae77-88fcfe603d77.png"
              alt="Logo OBREASY"
              width={120}
              height={120}
              className="h-12 w-auto mx-auto"
              priority
            />
          </div>

          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-8">
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Nenhuma obra cadastrada
          </h1>

          <p className="text-xl text-gray-600 mb-10">
            Comece criando sua primeira obra para ter controle total sobre sua construção ou reforma
          </p>

          <Button 
            onClick={handleCriarObra}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-6 text-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar minha obra
          </Button>
        </div>
      </div>
    )
  }

  // Lista de obras (2+ obras)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Image
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/979b9040-0d37-4e0d-ae77-88fcfe603d77.png"
            alt="Logo OBREASY"
            width={120}
            height={120}
            className="h-12 w-auto mb-6"
            priority
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Minhas Obras
              </h1>
              <p className="text-gray-600">
                Selecione uma obra para acessar o dashboard completo
              </p>
            </div>

            <Button 
              onClick={handleCriarObra}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar nova obra
            </Button>
          </div>
        </div>

        {/* Grid de obras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {obras.map((obra) => {
            const metricas = calcularMetricasObra(obra.id)
            const isDeleting = deletingObraId === obra.id
            
            return (
              <Card 
                key={obra.id}
                className="p-6 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-300 relative"
                onClick={() => !isDeleting && handleSelecionarObra(obra.id)}
              >
                {/* Botão de excluir no canto superior direito */}
                <button
                  onClick={(e) => handleOpenDeleteModal(e, obra)}
                  disabled={isDeleting}
                  className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  title="Excluir obra"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Header do card */}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200 pr-12">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 truncate">
                      {obra.nome}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm truncate">
                        {obra.tipo === "construcao" ? "Construção" : "Reforma"} • {obra.localizacao.cidade}/{obra.localizacao.estado}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard básico - 4 métricas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Orçamento Estimado */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">Orçamento</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {metricas.orcamentoEstimado > 0 
                        ? formatarMoeda(metricas.orcamentoEstimado) 
                        : "Não definido"}
                    </p>
                  </div>

                  {/* Total Gasto */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">Total Gasto</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatarMoeda(metricas.totalGasto)}
                    </p>
                  </div>

                  {/* Saldo Disponível */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <PiggyBank className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">Saldo</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {metricas.orcamentoEstimado > 0 
                        ? formatarMoeda(metricas.saldoDisponivel) 
                        : "—"}
                    </p>
                  </div>

                  {/* Custo por m² */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">Custo/m²</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {metricas.areaM2 > 0 
                        ? formatarMoeda(metricas.custoPorM2)
                        : "—"}
                    </p>
                    {metricas.areaM2 > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{metricas.areaM2} m²</p>
                    )}
                  </div>
                </div>

                {/* Botão de ação */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleSelecionarObra(obra.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Excluindo..." : "Abrir obra"}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && obraToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {/* Ícone de alerta */}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Excluir obra?
            </h2>

            {/* Nome da obra */}
            <p className="text-center text-gray-600 font-medium mb-4">
              {obraToDelete.nome}
            </p>

            {/* Texto de aviso */}
            <p className="text-gray-600 text-center mb-6">
              Essa ação é permanente e removerá despesas, profissionais, pagamentos e configurações vinculadas a esta obra.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                onClick={handleCloseDeleteModal}
                variant="outline"
                className="flex-1"
                disabled={deletingObraId !== null}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deletingObraId !== null}
              >
                {deletingObraId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
