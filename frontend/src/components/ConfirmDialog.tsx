import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type DialogType = 'confirm' | 'alert' | 'warning';

interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
}

interface DialogState extends DialogOptions {
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  confirm: (opts: DialogOptions | string) => Promise<boolean>;
  alert: (opts: DialogOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const icons: Record<DialogType, JSX.Element> = {
  confirm: (
    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  alert: (
    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
};

const iconBg: Record<DialogType, string> = {
  confirm: 'bg-red-50',
  alert: 'bg-blue-50',
  warning: 'bg-amber-50',
};

const confirmBtnClass: Record<DialogType, string> = {
  confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  alert: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const openDialog = useCallback((opts: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ ...opts, resolve });
    });
  }, []);

  const confirm = useCallback((opts: DialogOptions | string): Promise<boolean> => {
    const options = typeof opts === 'string' ? { message: opts } : opts;
    return openDialog({ type: 'confirm', confirmText: 'Confirmar', cancelText: 'Cancelar', ...options });
  }, [openDialog]);

  const alert = useCallback(async (opts: DialogOptions | string): Promise<void> => {
    const options = typeof opts === 'string' ? { message: opts } : opts;
    await openDialog({ type: 'alert', confirmText: 'OK', ...options });
  }, [openDialog]);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const type = dialog?.type ?? 'confirm';
  const isAlertOnly = type === 'alert';

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={isAlertOnly ? handleConfirm : handleCancel}
          />

          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            {/* Icon */}
            <div className={`w-14 h-14 rounded-full ${iconBg[type]} flex items-center justify-center mx-auto mb-4`}>
              {icons[type]}
            </div>

            {/* Title */}
            {dialog.title && (
              <h3 className="text-center text-lg font-bold text-gray-800 font-outer-sans mb-2">
                {dialog.title}
              </h3>
            )}

            {/* Message */}
            <p className="text-center text-gray-600 font-outer-sans text-sm leading-relaxed mb-6">
              {dialog.message}
            </p>

            {/* Buttons */}
            <div className={`flex gap-3 ${isAlertOnly ? 'justify-center' : ''}`}>
              {!isAlertOnly && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold font-outer-sans text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {dialog.cancelText ?? 'Cancelar'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`${isAlertOnly ? 'px-10' : 'flex-1'} px-4 py-2.5 rounded-xl text-white font-semibold font-outer-sans text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnClass[type]}`}
              >
                {dialog.confirmText ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider');
  return ctx;
}
