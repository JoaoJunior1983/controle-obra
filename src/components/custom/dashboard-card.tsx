"use client"

import { LucideIcon } from "lucide-react"

interface DashboardCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
}

export default function DashboardCard({ title, value, subtitle, icon: Icon, trend }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-700" />
        </div>
        {trend && (
          <span className={`text-sm font-inter font-medium px-2 py-1 rounded-lg ${
            trend.positive 
              ? "bg-emerald-50 text-emerald-700" 
              : "bg-red-50 text-red-700"
          }`}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <h3 className="text-sm font-inter text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-poppins font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-inter text-gray-400">{subtitle}</p>
    </div>
  )
}
