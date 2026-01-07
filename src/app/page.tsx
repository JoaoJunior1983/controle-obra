"use client"

import { Building2, TrendingUp, Wallet, Users, CheckCircle2, ArrowRight } from "lucide-react"
import DashboardCard from "@/components/custom/dashboard-card"
import Navbar from "@/components/custom/navbar"
import Quiz from "@/components/custom/quiz"
import AuthModal from "@/components/custom/auth-modal"
import Image from "next/image"
import { useState } from "react"

export default function Home() {
  const [showQuiz, setShowQuiz] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [quizData, setQuizData] = useState<any>(null)

  const handleLoginClick = () => {
    setShowAuthModal(true)
  }

  const handleQuizComplete = (data: any) => {
    setQuizData(data)
    setShowQuiz(false)
    setShowAuthModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <Navbar onLoginClick={handleLoginClick} />

      {/* Quiz Modal */}
      {showQuiz && <Quiz onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          hasQuizData={!!quizData}
          quizData={quizData}
        />
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-50/40 via-slate-50/30 to-white">
        {/* Logo OBREASY como marca d'água em AZUL com maior opacidade */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
              alt=""
              width={1200}
              height={1200}
              className="opacity-[0.08] scale-150"
              style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(180deg) brightness(0.6)' }}
              priority
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge - DESTAQUE AUMENTADO */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 px-6 py-3 rounded-full text-base sm:text-lg font-inter font-bold mb-8 border-2 border-emerald-200 shadow-lg shadow-emerald-100/50">
              <CheckCircle2 className="w-5 h-5" />
              Economize até 20% na sua obra
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-poppins font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Sua obra, simples e sob controle
            </h1>
            
            {/* Description */}
            <p className="text-xl sm:text-2xl text-gray-600 font-inter leading-relaxed mb-10 max-w-3xl mx-auto">
              Controle gastos, acompanhe fases e organize sua construção ou reforma com transparência total entre dono e construtor.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button 
                onClick={handleLoginClick}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-inter font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-105 transform"
              >
                Entrar / Criar conta
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowQuiz(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-inter font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Descubra quanto pode economizar
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 border-t border-gray-200">
              <div>
                <p className="text-3xl sm:text-4xl font-poppins font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">20%</p>
                <p className="text-sm text-gray-500 font-inter">Economia média</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-poppins font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">100%</p>
                <p className="text-sm text-gray-500 font-inter">Transparência</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 mb-1">24/7</p>
                <p className="text-sm text-gray-500 font-inter">Acesso total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-poppins font-bold text-gray-900 mb-4">
              Quem usa o OBREASY economiza de verdade
            </h2>
            <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
              Relatos reais de quem conseguiu mais controle, menos desperdício e economia na obra.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-poppins font-bold text-gray-900 mb-1">Carlos M.</h3>
                <p className="text-sm text-gray-500 font-inter">Construção residencial</p>
              </div>
              <p className="text-gray-600 font-inter leading-relaxed mb-6">
                "Antes do OBREASY eu não tinha ideia para onde o dinheiro da obra estava indo. Com o controle de despesas e mão de obra, consegui reduzir desperdícios e economizei cerca de R$ 18.000,00 na obra."
              </p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-inter font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Economia de R$ 18.000
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-poppins font-bold text-gray-900 mb-1">Fernanda S.</h3>
                <p className="text-sm text-gray-500 font-inter">Reforma de apartamento</p>
              </div>
              <p className="text-gray-600 font-inter leading-relaxed mb-6">
                "O aplicativo me ajudou a organizar gastos, profissionais e pagamentos. Só de evitar compras duplicadas e retrabalho, economizei mais de R$ 12.000,00."
              </p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-inter font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Economia de R$ 12.000
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-poppins font-bold text-gray-900 mb-1">João P.</h3>
                <p className="text-sm text-gray-500 font-inter">Casa própria</p>
              </div>
              <p className="text-gray-600 font-inter leading-relaxed mb-6">
                "Com o OBREASY eu passei a acompanhar tudo em tempo real. O custo por metro quadrado ficou claro e consegui manter a obra dentro do orçamento, economizando aproximadamente R$ 25.000,00."
              </p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-inter font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Economia de R$ 25.000
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-poppins font-bold text-gray-900 mb-4">
              Dashboard Completo
            </h2>
            <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
              Acompanhe todos os números da sua obra em tempo real com clareza e precisão
            </p>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <DashboardCard
              title="Total Gasto"
              value="R$ 85.420"
              subtitle="de R$ 100.000 orçados"
              icon={Wallet}
              trend={{ value: "14,6%", positive: false }}
            />
            <DashboardCard
              title="Custo por m²"
              value="R$ 1.708"
              subtitle="Área: 50m²"
              icon={TrendingUp}
              trend={{ value: "8,2%", positive: true }}
            />
            <DashboardCard
              title="Profissionais"
              value="8"
              subtitle="5 ativos no momento"
              icon={Users}
            />
            <DashboardCard
              title="Fases Concluídas"
              value="6/10"
              subtitle="60% da obra"
              icon={CheckCircle2}
              trend={{ value: "No prazo", positive: true }}
            />
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <h3 className="text-2xl font-poppins font-bold text-gray-900 mb-8">
              Distribuição de Gastos
            </h3>
            <div className="grid md:grid-cols-2 gap-10">
              {/* Materials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-gray-700 font-medium">Materiais</span>
                  <span className="font-poppins font-bold text-gray-900 text-lg">R$ 51.252</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all shadow-sm" style={{ width: "60%" }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-inter">60% do total</span>
                  <span className="text-gray-500 font-inter">R$ 1.025/m²</span>
                </div>
              </div>

              {/* Labor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-gray-700 font-medium">Mão de obra</span>
                  <span className="font-poppins font-bold text-gray-900 text-lg">R$ 34.168</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all shadow-sm" style={{ width: "40%" }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-inter">40% do total</span>
                  <span className="text-gray-500 font-inter">R$ 683/m²</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-poppins font-bold text-gray-900 mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
              Funcionalidades pensadas para donos de obra e construtores
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: "Gestão de Obras",
                description: "Crie e acompanhe múltiplas obras simultaneamente com controle total"
              },
              {
                icon: Wallet,
                title: "Controle Financeiro",
                description: "Registre despesas, pagamentos e acompanhe o orçamento em tempo real"
              },
              {
                icon: Users,
                title: "Profissionais",
                description: "Gerencie contratos, pagamentos e extras de todos os profissionais"
              },
              {
                icon: CheckCircle2,
                title: "Fases da Obra",
                description: "Acompanhe o progresso de cada etapa da construção ou reforma"
              },
              {
                icon: TrendingUp,
                title: "Relatórios",
                description: "Gere relatórios completos em PDF com todos os dados da obra"
              },
              {
                icon: Building2,
                title: "Diário de Fotos",
                description: "Registre o progresso visual com fotos, comentários e curtidas"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                  <feature.icon className="w-7 h-7 text-blue-700" />
                </div>
                <h3 className="text-xl font-poppins font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-inter leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-poppins font-bold text-white mb-6">
            Pronto para organizar sua obra?
          </h2>
          <p className="text-xl text-gray-300 font-inter mb-10">
            Comece agora e tenha controle total sobre sua construção ou reforma
          </p>
          <button 
            onClick={handleLoginClick}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-inter font-bold text-lg shadow-2xl hover:shadow-blue-500/50 inline-flex items-center gap-2 hover:scale-105 transform"
          >
            Criar minha primeira obra
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
              alt="OBREASY Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="font-poppins font-bold text-2xl text-gray-900">OBREASY</span>
          </div>
          <p className="text-gray-600 font-inter mb-2">
            Sua obra, simples e sob controle
          </p>
          <p className="text-gray-400 text-sm font-inter">
            © 2024 OBREASY. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}