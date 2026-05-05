// Ícones SVG minimalistas
const ResultsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export function ResultsRegister() {
  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-2 font-outer-sans">
          Registro de Resultados
        </h1>
        <p className="text-gray-600 font-outer-sans">Registre suas vendas e resultados de campanhas</p>
      </div>
      
      <div className="card-gradient animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center shadow-lg">
            <ResultsIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Formulário de Registro</h2>
        </div>
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-wine-50 to-gold-50 rounded-lg border border-wine-200">
          <p className="text-gray-500 font-outer-sans">Formulário de registro será implementado aqui</p>
        </div>
      </div>
    </div>
  );
}

