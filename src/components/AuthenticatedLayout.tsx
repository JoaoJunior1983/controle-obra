"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Header from "./Header"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname()
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    // Verificar se deve mostrar o header
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    
    // Rotas onde o header NÃO deve aparecer
    const noHeaderRoutes = ["/", "/login"]
    
    // Mostrar header se estiver autenticado E não estiver em rota de exceção
    const shouldShow = isAuthenticated && !noHeaderRoutes.includes(pathname)
    setShowHeader(shouldShow)
  }, [pathname])

  if (!showHeader) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <div className="pt-16">
        {children}
      </div>
    </>
  )
}
