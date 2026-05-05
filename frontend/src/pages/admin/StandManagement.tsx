import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { StandUpdatesManager } from './StandUpdatesManager';

export function StandManagement() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin', 'clients'],
    queryFn: async () => (await api.get('/admin/clients')).data,
  });

  const selected = clients.find((c: any) => c.id === selectedClientId);

  return (
    <div className="flex gap-5 h-full animate-fade-in">
      {/* Client list panel */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 font-outer-sans">Clientes</h3>
            <p className="text-xs text-gray-500 font-outer-sans mt-0.5">Selecione para gerenciar</p>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {clients.map((client: any) => {
                const active = client.id === selectedClientId;
                const name = client.clients?.businessName || client.name || 'Cliente';
                const initial = name.charAt(0).toUpperCase();
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active ? 'bg-red-50 border-l-2 border-red-700' : 'hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      active ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate font-outer-sans ${active ? 'text-red-800' : 'text-gray-700'}`}>
                        {name}
                      </p>
                      {client.clients?.mainEmail && (
                        <p className="text-[11px] text-gray-400 truncate font-outer-sans">{client.clients.mainEmail}</p>
                      )}
                    </div>
                  </button>
                );
              })}
              {clients.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center font-outer-sans">Nenhum cliente cadastrado</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stand updates panel */}
      <div className="flex-1 min-w-0">
        {selectedClientId ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 font-outer-sans">
                  {selected?.clients?.businessName || selected?.name}
                </h3>
                <p className="text-xs text-gray-400 font-outer-sans">Acompanhamento do stand</p>
              </div>
            </div>
            <StandUpdatesManager clientId={selectedClientId} />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600 font-outer-sans">Selecione um cliente</p>
            <p className="text-xs text-gray-400 font-outer-sans mt-1">Escolha um cliente na lista para gerenciar as atualizações do stand</p>
          </div>
        )}
      </div>
    </div>
  );
}
