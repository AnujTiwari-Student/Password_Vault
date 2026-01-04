import { TriangleAlert } from "lucide-react"

interface FormErrorProps {
  message?: string | null
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null
  return (
    <div className="flex items-center gap-x-2 text-destructive bg-destructive/15 text-sm font-medium p-3 rounded-md">
      <TriangleAlert className="h-4 w-4" />
      <p>{message}</p>
    </div>
  )
}