import { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set(['ai']));

  const togglePlan = (planId: string) => {
    const newSelected = new Set(selectedPlans);
    if (newSelected.has(planId)) {
      newSelected.delete(planId);
    } else {
      newSelected.add(planId);
    }
    setSelectedPlans(newSelected);
  };

  if (!isOpen) return null;

  // Componentes de ícones SVG
  const GearIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const SparkleIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  const AutomationIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const ChatIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const CommentIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );

  const TargetIcon = () => (
    <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const plans = [
    {
      id: 'ai',
      title: 'BGA STANDS IA',
      badge: 'IA',
      badgeText: 'Esta extensão é exclusiva da versão Pro',
      price: 'R$ 299',
      period: '/mês',
      description: 'Aprimore o BGA STANDS Pro usando IA para automações mais eficientes, interações mais eficazes e mais conversões com menos trabalho',
      features: [
        {
          icon: <GearIcon />,
          text: 'Fornece respostas automáticas para todas as FAQs',
        },
        {
          icon: <UsersIcon />,
          text: 'Turbine suas vendas e suporte',
        },
        {
          icon: <SparkleIcon />,
          text: 'Reformula e melhora o texto',
        },
        {
          icon: <AutomationIcon />,
          text: 'Desenvolve automações instantâneas',
        },
        {
          icon: <ChatIcon />,
          text: 'Responde o tempo todo, mantendo seu tom e estilo',
          badge: 'BETA',
        },
        {
          icon: <CommentIcon />,
          text: 'Transforma elogios em bate-papos',
          badge: 'BETA',
        },
        {
          icon: <TargetIcon />,
          text: 'Diga à IA quais são suas metas de engajamento',
        },
      ],
    },
  ];

  const total = Array.from(selectedPlans).reduce((sum, planId) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const price = parseInt(plan.price.replace('R$ ', '').replace('.', ''));
      return sum + price;
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-wine-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">
              Descubra todo o poder do marketing por mensagem
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Plans */}
            <div className="lg:col-span-2 space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-xl p-6 transition-all duration-200 cursor-pointer ${
                    selectedPlans.has(plan.id)
                      ? 'border-wine-500 bg-wine-50/50 shadow-lg'
                      : 'border-gray-200 hover:border-wine-300 bg-white'
                  }`}
                  onClick={() => togglePlan(plan.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPlans.has(plan.id)}
                        onChange={() => togglePlan(plan.id)}
                        className="w-5 h-5 text-wine-600 border-gray-300 rounded focus:ring-wine-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-800 font-outer-sans">{plan.title}</h3>
                          {plan.badge && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        {plan.badgeText && (
                          <p className="text-xs text-gray-500 mt-1 font-outer-sans">{plan.badgeText}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-800 font-outer-sans">{plan.price}</span>
                        <span className="text-sm text-gray-600 font-outer-sans">{plan.period}</span>
                      </div>
                      {plan.starts && (
                        <p className="text-xs text-gray-500 mt-1 font-outer-sans">{plan.starts}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 font-outer-sans">{plan.description}</p>

                  {plan.link && (
                    <a href="#" className="text-wine-600 hover:text-wine-700 text-sm font-semibold font-outer-sans">
                      {plan.link} →
                    </a>
                  )}

                  {plan.features && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5 p-1.5 bg-wine-50 rounded-lg">
                            {feature.icon}
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <p className="text-sm text-gray-700 font-outer-sans">{feature.text}</p>
                            {feature.badge && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">
                                {feature.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Comparison Table */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 font-outer-sans">Comparar planos</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 font-outer-sans">
                          Princípios básicos
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 font-outer-sans">
                          Grátis
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 font-outer-sans">
                          Marketing Automation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 font-outer-sans">Limite do Contato</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-outer-sans">
                          Até 1.000 contatos
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-outer-sans">
                          Por nível
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700 font-outer-sans">Vagas para membros da equipe</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-outer-sans">
                          1 Membro da Equipe
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-outer-sans">
                          Ilimitado
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 font-outer-sans">
                          Limite de Ferramentas de Captura de Leads
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-outer-sans">
                          4 Ferramentas de Captura de Leads
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-outer-sans">
                          Ilimitado
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button className="mt-4 text-wine-600 hover:text-wine-700 text-sm font-semibold font-outer-sans">
                  Ver Tabela Completa →
                </button>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 border-2 border-gray-200 rounded-xl p-6 bg-white">
                <h3 className="text-lg font-bold text-gray-800 mb-4 font-outer-sans">Resumo do pedido</h3>

                <div className="space-y-3 mb-6">
                  {Array.from(selectedPlans).map((planId) => {
                    const plan = plans.find(p => p.id === planId);
                    if (!plan) return null;
                    return (
                      <div key={planId} className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-sm text-gray-700 font-outer-sans">{plan.title}</span>
                        <span className="text-sm font-semibold text-gray-800 font-outer-sans">{plan.price}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mb-6 pt-3 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-800 font-outer-sans">Total</span>
                  <span className="text-2xl font-bold text-wine-600 font-outer-sans">R$ {total}</span>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-4 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-outer-sans mb-3">
                  Assinar
                </button>

                <a href="#" className="block text-center text-sm text-wine-600 hover:text-wine-700 font-outer-sans mb-4">
                  Aplicar Cupom
                </a>

                <div className="text-xs text-gray-500 space-y-2 font-outer-sans">
                  <p>
                    O pagamento é processado imediatamente ao assinar. Você pode cancelar seu plano a qualquer momento.
                  </p>
                  <p>
                    Ao continuar, você concorda com os{' '}
                    <a href="#" className="text-wine-600 hover:underline">
                      Termos Adicionais de Serviço da BGA STANDS IA
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

