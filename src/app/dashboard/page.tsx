"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, FolderOpen } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [obras, setObras] = useState<any[]>([])

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    
    if (!isAuthenticated) {
      // Se não estiver autenticado, redirecionar para home
      router.push("/")
      return
    }

    // Carregar nome do usuário
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUserName(user.name || "")
    }

    // Carregar obras do usuário
    const obrasData = localStorage.getItem("obras")
    if (obrasData) {
      const todasObras = JSON.parse(obrasData)
      setObras(todasObras)
    }
  }, [router])

  const handleCriarObra = () => {
    router.push("/dashboard/criar-obra")
  }

  const handleAcessarObras = () => {
    // Sempre navegar para /obras (a página /obras gerencia a lógica de redirecionamento)
    router.push("/obras")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Ícone decorativo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-8">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>

        {/* Título de boas-vindas */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold text-gray-900 mb-4">
          {userName ? `Bem-vindo, ${userName.split(" ")[0]}!` : "Bem-vindo!"}
        </h1>

        {/* Texto principal */}
        <p className="text-2xl sm:text-3xl text-gray-600 font-inter mb-12">
          Sua obra começa aqui
        </p>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Botão primário - Criar obra */}
          <button 
            onClick={handleCriarObra}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-inter font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform inline-flex items-center gap-3 w-full sm:w-auto"
          >
            <Sparkles className="w-6 h-6" />
            Criar minha obra
          </button>

          {/* Botão secundário - Acessar obras */}
          <button 
            onClick={handleAcessarObras}
            className="bg-white border-2 border-blue-600 text-blue-600 px-10 py-5 rounded-xl hover:bg-blue-50 transition-all font-inter font-bold text-lg shadow-md hover:shadow-lg hover:scale-105 transform inline-flex items-center gap-3 w-full sm:w-auto"
          >
            <FolderOpen className="w-6 h-6" />
            Acessar minha(s) obra(s)
          </button>
        </div>

        {/* Texto auxiliar */}
        <p className="text-gray-500 font-inter text-sm mt-8">
          Em breve você terá acesso a todas as funcionalidades do OBREASY
        </p>
      </div>
    </div>
  )
}
