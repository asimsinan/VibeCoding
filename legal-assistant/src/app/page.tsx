'use client';

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-7xl w-full relative">
        {/* Animated background elements */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A237E] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 mb-8 bg-gradient-to-r from-[#1A237E]/10 to-indigo-100 rounded-full backdrop-blur-sm border border-[#1A237E]/20 shadow-lg">
              <span className="text-[#1A237E] font-semibold text-sm">AI-Powered Legal Assistant</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-[#1A237E] via-[#283593] to-indigo-600 bg-clip-text text-transparent">
              Turkish Legal Assistant
            </h1>
            <p className="text-gray-600 text-xl md:text-2xl mb-12 font-light">Yapay zeka destekli hukuki belge analizi ve danışmanlık</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Link 
                href="/login" 
                className="group relative px-10 py-4 bg-gradient-to-r from-[#1A237E] to-[#283593] text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş Yap
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#283593] to-[#3949ab] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/register" 
                className="group relative px-10 py-4 bg-white text-[#1A237E] font-semibold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-[#1A237E] hover:border-[#283593] transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Kayıt Ol
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#1A237E] to-[#283593] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="absolute inset-0 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">Kayıt Ol</span>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-20">
            {[
              { icon: '📄', title: 'Belge Yükleme', desc: 'PDF ve DOCX formatında belgeleri kolayca yükleyin' },
              { icon: '💬', title: 'AI Sohbet', desc: 'Türkçe yapay zeka destekli hukuki danışmanlık' },
              { icon: '🔍', title: 'KVKK Analizi', desc: 'Otomatik KVKK uyumluluk kontrolü ve raporlama' },
              { icon: '📝', title: 'Sözleşme Üretimi', desc: 'Özelleştirilmiş hukuki belgeler oluşturun' }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-[#1A237E] mb-3">{feature.title}</h3>
                <p className="text-gray-600 font-light">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </main>
  )
}

