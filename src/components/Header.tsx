"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, LogOut, FolderOpen, Bell, Settings } from "lucide-react"
import { getActiveObra } from "@/lib/storage"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("U")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [obraAtiva, setObraAtiva] = useState<string | null>(null)
  const [activeObraId, setActiveObraId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadUserData = () => {
    // Priorizar userProfile
    const userProfileStr = localStorage.getItem("userProfile")
    const userDataStr = localStorage.getItem("user")
    
    let name = ""
    let email = ""
    let avatar: string | null = null

    if (userProfileStr) {
      const profile = JSON.parse(userProfileStr)
      name = profile.name || ""
      email = profile.email || ""
      avatar = profile.avatarDataUrl || null
    } else if (userDataStr) {
      const user = JSON.parse(userDataStr)
      name = user.name || ""
      email = user.email || ""
      avatar = user.avatarDataUrl || null
    }

    setUserName(name)
    setAvatarUrl(avatar)
    
    // Gerar iniciais
    if (name) {
      const parts = name.trim().split(" ")
      if (parts.length >= 2) {
        setUserInitials(parts[0][0] + parts[parts.length - 1][0])
      } else {
        setUserInitials(parts[0][0])
      }
    } else if (email) {
      setUserInitials(email[0])
    } else {
      setUserInitials("U")
    }
  }

  useEffect(() => {
    loadUserData()

    // Carregar obra ativa
    const obra = getActiveObra()
    setObraAtiva(obra?.nome || null)
    setActiveObraId(obra?.id || null)

    // Listener para atualização de perfil
    const handleProfileUpdate = () => {
      loadUserData()
    }

    window.addEventListener("userProfileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate)
    }
  }, [pathname])

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("activeObraId")
    router.push("/")
  }

  const handleNavigation = (path: string) => {
    setMenuOpen(false)
    router.push(path)
  }

  const handleLogoClick = () => {
    if (activeObraId) {
      router.push(`/dashboard?obraId=${activeObraId}`)
    } else {
      router.push("/obras")
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo clicável */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Ir para página inicial"
          >
            <img 
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/f350fbaf-266c-404d-8471-e0e89b5a6eda.jpg" 
              alt="Obreasy" 
              className="h-10 w-auto"
            />

          </button>

          {/* Centro - Obra ativa */}
          <div className="hidden md:flex items-center">
            {obraAtiva ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FolderOpen className="w-4 h-4" />
                <span className="font-medium">{obraAtiva}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Nenhuma obra selecionada</span>
            )}
          </div>

          {/* Avatar e menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors overflow-hidden"
              aria-label="Menu do usuário"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitials.toUpperCase()}</span>
              )}
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Nome do usuário */}
                {userName && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                  </div>
                )}

                {/* Opções do menu */}
                <button
                  onClick={() => handleNavigation("/dashboard/conta")}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Minha Conta
                </button>

                <button
                  onClick={() => handleNavigation("/obras")}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Minhas Obras
                </button>

                <button
                  onClick={() => handleNavigation("/dashboard/alertas")}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Alertas
                </button>

                <button
                  onClick={() => handleNavigation("/dashboard/configuracoes")}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
