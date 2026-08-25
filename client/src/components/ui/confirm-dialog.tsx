import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Info, Trash2, X } from "lucide-react";

export type DialogVariant = "danger" | "warning" | "info" | "success" | "question";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  variant?: DialogVariant;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  showAlert: (options: AlertOptions | string) => Promise<void>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: DialogVariant;
    resolve?: (value: boolean) => void;
  }>({
    title: "Confirmar Ação",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    variant: "question",
  });

  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof options === "string" ? { message: options } : options;
      setIsAlertMode(false);
      setConfig({
        title: opts.title || (opts.variant === "danger" ? "Atenção: Exclusão" : "Confirmar Ação"),
        message: opts.message,
        confirmText: opts.confirmText || (opts.variant === "danger" ? "Sim, Excluir" : "Confirmar"),
        cancelText: opts.cancelText || "Cancelar",
        variant: opts.variant || (opts.variant === "danger" ? "danger" : "question"),
        resolve,
      });
      setIsOpen(true);
    });
  };

  const showAlert = (options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts = typeof options === "string" ? { message: options } : options;
      setIsAlertMode(true);
      setConfig({
        title: opts.title || (opts.variant === "danger" ? "Erro" : opts.variant === "success" ? "Sucesso" : "Aviso"),
        message: opts.message,
        confirmText: opts.buttonText || "Entendido",
        cancelText: "",
        variant: opts.variant || "info",
        resolve: () => resolve(),
      });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (config.resolve) config.resolve(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (config.resolve) config.resolve(false);
  };

  const getIcon = () => {
    switch (config.variant) {
      case "danger":
        return <Trash2 className="w-6 h-6 text-red-400 animate-pulse" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-400" />;
      case "question":
      default:
        return <HelpCircle className="w-6 h-6 text-amber-400" />;
    }
  };

  const getHeaderBg = () => {
    switch (config.variant) {
      case "danger":
        return "bg-red-950/40 border-red-500/20 text-red-200";
      case "warning":
        return "bg-amber-950/40 border-amber-500/20 text-amber-200";
      case "success":
        return "bg-emerald-950/40 border-emerald-500/20 text-emerald-200";
      case "info":
        return "bg-blue-950/40 border-blue-500/20 text-blue-200";
      case "question":
      default:
        return "bg-amber-950/30 border-amber-500/20 text-amber-100";
    }
  };

  const getConfirmButtonClasses = () => {
    if (config.variant === "danger") {
      return "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-950/50 border border-red-500/30 font-medium px-5 py-2.5 rounded-lg transition-all";
    }
    if (config.variant === "success") {
      return "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-500/30 font-medium px-5 py-2.5 rounded-lg transition-all";
    }
    return "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-semibold shadow-lg shadow-amber-950/50 border border-amber-400/40 px-5 py-2.5 rounded-lg transition-all cursor-pointer";
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm, showAlert }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent className="bg-slate-900/95 border border-slate-700/80 text-slate-100 shadow-2xl backdrop-blur-xl max-w-md rounded-2xl p-0 overflow-hidden">
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${getHeaderBg()}`}>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50 flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-base font-semibold tracking-wide text-slate-100">
                {config.title}
              </AlertDialogTitle>
            </div>
          </div>

          <div className="px-6 py-5">
            <AlertDialogDescription className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
              {config.message}
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
            {!isAlertMode && (
              <AlertDialogCancel
                onClick={handleCancel}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 px-4 py-2 rounded-lg transition-colors font-normal text-sm cursor-pointer"
              >
                {config.cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={getConfirmButtonClasses()}
            >
              {config.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog deve ser usado dentro de um ConfirmDialogProvider");
  }
  return context;
}
