// Ícones SVG minimalistas
const ReportsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function ReportsView() {
  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-2 font-outer-sans">
          Relatórios
        </h1>
        <p className="text-gray-600 font-outer-sans">Visualize e baixe seus relatórios de desempenho</p>
      </div>
      
      <div className="card-gradient animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg">
            <ReportsIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Meus Relatórios</h2>
        </div>
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gold-50 to-wine-50 rounded-lg border border-gold-200">
          <p className="text-gray-500 font-outer-sans">Lista de relatórios será exibida aqui</p>
        </div>
      </div>
    </div>
  );
}

