"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, ArrowLeft, Camera, Save, X, Eye, EyeOff } from "lucide-react"

interface UserProfile {
  name: string
  email: string
  phone: string
  avatarDataUrl: string | null
  password?: string
}

export default function MinhaContaPage() {
  const router = useRouter()
  const [loading, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  
  // Estados do formulário
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    avatarDataUrl: null,
  })
  
  const [originalData, setOriginalData] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    avatarDataUrl: null,
  })

  // Estados de senha
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Carregar dados do usuário
    loadUserData()
  }, [router])

  const loadUserData = () => {
    const userDataStr = localStorage.getItem("user")
    const userProfileStr = localStorage.getItem("userProfile")
    
    let userData: UserProfile = {
      name: "",
      email: "",
      phone: "",
      avatarDataUrl: null,
    }

    // Priorizar userProfile se existir
    if (userProfileStr) {
      const profile = JSON.parse(userProfileStr)
      userData = {
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        avatarDataUrl: profile.avatarDataUrl || null,
      }
    } else if (userDataStr) {
      // Fallback para user antigo
      const user = JSON.parse(userDataStr)
      userData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatarDataUrl: user.avatarDataUrl || null,
      }
    }

    setFormData(userData)
    setOriginalData(userData)
  }

  const showMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      showMessage("Formato inválido. Use JPG, PNG ou WEBP.", "error")
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Imagem muito grande. Máximo 5MB.", "error")
      return
    }

    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setFormData(prev => ({ ...prev, avatarDataUrl: dataUrl }))
    }
    reader.onerror = () => {
      showMessage("Erro ao carregar imagem.", "error")
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")
    
    // Aplica máscara (##) #####-####
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateForm = (): string | null => {
    // Nome: mínimo 2 caracteres
    if (formData.name.trim().length < 2) {
      return "Nome deve ter pelo menos 2 caracteres."
    }

    // Email: obrigatório e válido
    if (!formData.email.trim()) {
      return "Email é obrigatório."
    }
    if (!validateEmail(formData.email)) {
      return "Email inválido."
    }

    // Telefone: se preenchido, validar mínimo de dígitos
    if (formData.phone) {
      const numbers = formData.phone.replace(/\D/g, "")
      if (numbers.length > 0 && numbers.length < 10) {
        return "Telefone deve ter pelo menos 10 dígitos."
      }
    }

    // Senha: se preenchida, validar
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        return "Nova senha deve ter pelo menos 6 caracteres."
      }
      if (newPassword !== confirmPassword) {
        return "As senhas não coincidem."
      }
    }

    return null
  }

  const handleSave = async () => {
    // Validar
    const error = validateForm()
    if (error) {
      showMessage(error, "error")
      return
    }

    setSaving(true)

    try {
      // Preparar dados para salvar
      const profileToSave: UserProfile = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatarDataUrl: formData.avatarDataUrl,
      }

      // Se senha foi alterada, incluir
      if (newPassword && newPassword === confirmPassword) {
        profileToSave.password = newPassword
      }

      // Salvar no localStorage
      localStorage.setItem("userProfile", JSON.stringify(profileToSave))
      
      // Atualizar também o "user" antigo para compatibilidade
      const oldUser = JSON.parse(localStorage.getItem("user") || "{}")
      const updatedUser = {
        ...oldUser,
        name: profileToSave.name,
        email: profileToSave.email,
        phone: profileToSave.phone,
        avatarDataUrl: profileToSave.avatarDataUrl,
      }
      if (profileToSave.password) {
        updatedUser.password = profileToSave.password
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      // Atualizar estados
      setOriginalData(profileToSave)
      setNewPassword("")
      setConfirmPassword("")

      // Disparar evento customizado para atualizar Header
      window.dispatchEvent(new Event("userProfileUpdated"))

      showMessage("Perfil atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      showMessage("Erro ao salvar perfil. Tente novamente.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(originalData)
    setNewPassword("")
    setConfirmPassword("")
    showMessage("Alterações canceladas.", "success")
  }

  const getInitials = (name: string, email: string): string => {
    if (name) {
      const parts = name.trim().split(" ")
      if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0]
      }
      return parts[0][0]
    }
    return email ? email[0] : "U"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Toast */}
        {showToast && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 ${
            toastType === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}>
            {toastMessage}
          </div>
        )}

        {/* Botão voltar */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Conta</h1>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {formData.avatarDataUrl ? (
                <img
                  src={formData.avatarDataUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-4xl font-bold text-blue-600">
                    {getInitials(formData.name, formData.email).toUpperCase()}
                  </span>
                </div>
              )}
              
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer transition-colors shadow-lg"
              >
                <Camera className="w-5 h-5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Clique no ícone para alterar a foto
            </p>
          </div>

          {/* Formulário */}
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Alterar Senha
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Deixe em branco para manter a senha atual
              </p>

              {/* Nova senha */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Repita a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
