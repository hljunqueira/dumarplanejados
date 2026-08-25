import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive"
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                isDestructive 
                  ? "bg-red-500/20 text-red-400 border-red-500/40" 
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              }`}>
                {isDestructive ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              </div>
              <div className="grid gap-0.5 pr-4">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

