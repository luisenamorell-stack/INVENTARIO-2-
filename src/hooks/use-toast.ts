import { toast as toastManager } from "@/src/components/ui/toast"

export function useToast() {
  return {
    toast: (props: any) => (toastManager as any).add(props),
    dismiss: (id: string) => (toastManager as any).remove(id)
  }
}

export const toast = (props: any) => (toastManager as any).add(props)
