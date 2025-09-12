"use client"

import Link from "next/link"
import { ArrowLeft, Shield, Truck, CreditCard, CheckCircle } from "lucide-react"

interface CheckoutHeaderProps {
  currentStep: number
  onStepClick?: (step: number) => void
  canNavigateToStep?: (step: number) => boolean
}

const steps = [
  { id: 1, title: "Teslimat Bilgileri", icon: Truck, description: "Adres ve kişisel bilgiler" },
  { id: 2, title: "Ödeme Bilgileri", icon: CreditCard, description: "Ödeme yöntemi seçimi" },
  { id: 3, title: "Sipariş Özeti", icon: CheckCircle, description: "Onay ve tamamlama" },
]

export const CheckoutHeader = ({ 
  currentStep, 
  onStepClick,
  canNavigateToStep 
}: CheckoutHeaderProps) => {
  const handleStepClick = (stepId: number) => {
    if (onStepClick) {
      onStepClick(stepId)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/sepet" 
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Sepete Dön</span>
        </Link>
        <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Güvenli Ödeme</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Progress Steps */}
          <div className="hidden md:flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[#fed233] to-[#f4c430] -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const isClickable = onStepClick !== undefined
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300 ${
                      isCompleted 
                        ? "bg-[#fed233] border-[#fed233] text-white shadow-lg shadow-[#fed233]/30" 
                        : isCurrent
                        ? "bg-white border-[#fed233] text-[#fed233] shadow-lg"
                        : "bg-white border-gray-300 text-gray-400"
                    } ${
                      isClickable ? "cursor-pointer hover:scale-110 hover:shadow-xl" : "cursor-default"
                    }`}
                    onClick={() => handleStepClick(step.id)}
                    title={isClickable ? `${step.title} adımına git` : step.title}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>

                  {/* Step Content */}
                  <div className="mt-4 text-center max-w-32">
                    <h3 className={`font-semibold text-sm transition-colors duration-200 ${
                      isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs mt-1 transition-colors duration-200 ${
                      isCompleted || isCurrent ? "text-gray-600" : "text-gray-400"
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Step Number */}
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? "bg-[#fed233] text-white" 
                      : isCurrent
                      ? "bg-[#fed233] text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}>
                    {step.id}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile Progress Steps */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Adım {currentStep} / {steps.length}
              </span>
              <div className="flex space-x-1">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentStep >= step.id ? "bg-[#fed233]" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const isCompleted = currentStep > step.id
                  const isCurrent = currentStep === step.id
                  const isClickable = onStepClick !== undefined
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                          isCompleted 
                            ? "bg-[#fed233] border-[#fed233] text-white" 
                            : isCurrent
                            ? "bg-white border-[#fed233] text-[#fed233]"
                            : "bg-white border-gray-300 text-gray-400"
                        } ${
                          isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"
                        }`}
                        onClick={() => handleStepClick(step.id)}
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-2 font-medium transition-colors duration-200 ${
                        isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 