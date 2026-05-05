import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/client');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background com gradiente vinho escuro */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg,
              #1a0a0a 0%,
              #330d0d 20%,
              #5a0505 40%,
              #710505 60%,
              #a91919 80%,
              #c22a2a 100%
            )
          `,
        }}
      />

      {/* Efeito de ondas animadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(169, 25, 25, 0.2)" />
              <stop offset="50%" stopColor="rgba(245, 185, 50, 0.25)" />
              <stop offset="100%" stopColor="rgba(169, 25, 25, 0.2)" />
            </linearGradient>
          </defs>
          <path 
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z" 
            fill="url(#waveGradient)"
            className="animate-wave"
            style={{ animation: 'wave 8s ease-in-out infinite' }}
          />
          <path 
            d="M0,500 Q400,400 800,500 T1200,500 L1200,800 L0,800 Z" 
            fill="url(#waveGradient)"
            className="animate-wave"
            style={{ animation: 'wave 10s ease-in-out infinite', animationDelay: '2s', opacity: 0.7 }}
          />
          <path 
            d="M0,600 Q200,500 400,600 T800,600 T1200,600 L1200,800 L0,800 Z" 
            fill="url(#waveGradient)"
            className="animate-wave"
            style={{ animation: 'wave 12s ease-in-out infinite', animationDelay: '4s', opacity: 0.5 }}
          />
        </svg>
      </div>

      {/* Layout dividido */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        {/* Lado esquerdo - Texto promocional */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 text-white">
          {/* Logo no topo esquerdo */}
          <div className="mb-12 lg:mb-0">
            <img
              src="/LOGO.png"
              alt="BGA STANDS - Cenografia e Stands"
              className="h-24 md:h-32 lg:h-40 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Texto promocional centralizado verticalmente */}
          <div className="flex-1 flex flex-col justify-center space-y-4 lg:space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-outer-sans">
              <span className="block text-white">Sua marca</span>
              <span className="block text-gold-400">em evidência</span>
              <span className="block text-white">em cada evento</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-md font-outer-sans">
              Cenografia impactante, stands memoráveis e eventos que deixam marca. Seu espaço de negócios, nossa especialidade.
            </p>
          </div>
        </div>

        {/* Lado direito - Card de login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div 
            className="w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-10 transform transition-all duration-300 relative overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(113, 5, 5, 0.9) 0%,
                  rgba(169, 25, 25, 0.92) 50%,
                  rgba(113, 5, 5, 0.9) 100%
                )
              `,
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.85),
                0 0 0 1px rgba(255, 255, 255, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.18)
              `,
            }}
          >
            {/* Efeito de brilho no topo do vidro */}
            <div 
              className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
            />
            
            {/* Reflexos de vidro */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
              <div className="absolute top-10 right-10 w-40 h-40 bg-wine-700/20 rounded-full blur-3xl" />
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-wine-800/15 rounded-full blur-2xl" />
            </div>

            {/* Título */}
            <div className="text-center mb-8 relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg font-outer-sans">
                Bem-vindo
              </h1>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white/95 drop-shadow-sm font-outer-sans">
                  Email
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-wine-500' : 'text-gray-500'
                  }`}>
                    <span className="text-lg font-semibold">@</span>
                  </div>
            <input
                    id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-4 py-3.5 text-gray-900 bg-white border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-wine-500/40 focus:border-wine-500 shadow-md backdrop-blur-sm font-outer-sans placeholder:text-gray-500 ${
                      focusedField === 'email' 
                        ? 'border-wine-500 shadow-xl shadow-wine-500/30 scale-[1.01]' 
                        : 'border-gray-300/80 hover:border-wine-400 hover:shadow-lg'
                    } ${error ? 'border-wine-500 !bg-wine-50' : ''}`}
                    placeholder="seu@email.com"
              required
            />
          </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-white/95 drop-shadow-sm font-outer-sans">
                  Senha
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-wine-500' : 'text-gray-500'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
            <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-12 py-3.5 text-gray-900 bg-white border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-wine-500/40 focus:border-wine-500 shadow-md backdrop-blur-sm font-outer-sans placeholder:text-gray-500 ${
                      focusedField === 'password' 
                        ? 'border-wine-500 shadow-xl shadow-wine-500/30 scale-[1.01]' 
                        : 'border-gray-300/80 hover:border-wine-400 hover:shadow-lg'
                    } ${error ? 'border-wine-500 !bg-wine-50' : ''}`}
                    placeholder="••••••••"
              required
            />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-wine-600 transition-all duration-200 hover:scale-110"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-white/95 cursor-pointer group font-outer-sans">
                  <input 
                    type="checkbox" 
                    className="mr-2 w-4 h-4 text-wine-500 border-gray-300 rounded focus:ring-wine-400 bg-white transition-all duration-200 group-hover:border-wine-400" 
                  />
                  <span className="group-hover:text-white transition-colors font-outer-sans">Lembrar-me</span>
                </label>
                <a href="#" className="text-white/90 hover:text-white transition-all duration-200 font-medium hover:underline underline-offset-2 font-outer-sans">
                  Esqueceu a senha?
                </a>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <div className="bg-wine-50 border-2 border-wine-300 rounded-xl p-4 flex items-start gap-3 animate-shake shadow-md">
                  <svg className="w-5 h-5 text-wine-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-wine-700 text-sm font-semibold leading-relaxed font-outer-sans">{error}</p>
          </div>
              )}

              {/* Botão de submit */}
          <button
            type="submit"
            disabled={loading}
                className={`w-full py-4 px-4 rounded-xl font-bold text-white text-base transition-all duration-300 transform shadow-xl relative overflow-hidden group font-outer-sans ${
                  loading 
                    ? 'bg-wine-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-wine-600 via-wine-700 to-wine-800 hover:from-wine-700 hover:via-wine-800 hover:to-wine-900 hover:shadow-2xl hover:shadow-wine-600/60 hover:scale-[1.02] active:scale-[0.98]'
                } focus:outline-none focus:ring-4 focus:ring-wine-500/60`}
              >
                {/* Efeito de brilho no hover */}
                {!loading && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                )}
                {loading ? (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    Entrar
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
          </button>
        </form>

            {/* Rodapé */}
            <div className="mt-8 pt-6 border-t border-white/20 text-center relative z-10">
              <p className="text-sm text-white/80 font-medium font-outer-sans">
                © 2025 BGA STANDS - Cenografia e Eventos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

