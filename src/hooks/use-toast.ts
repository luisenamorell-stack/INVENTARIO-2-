import { toast as toastManager } from "@/src/components/ui/toast"

export function useToast() {
  return {
    toast: (props: any) => (toastManager as any).show(props),
    dismiss: (id: string) => (toastManager as any).dismiss(id)
  }
}

export const toast = (props: any) => (toastManager as any).show(props)
