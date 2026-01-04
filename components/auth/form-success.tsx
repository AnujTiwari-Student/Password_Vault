import { CircleCheckBig } from "lucide-react"

interface FormSuccessProps {
  message?: string | null
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null
  return (
    <div className="flex items-center gap-x-2 text-emerald-500 bg-emerald-500/15 text-sm font-medium p-3 rounded-md">
      <CircleCheckBig className="h-4 w-4" />
      <p>{message}</p>
    </div>
  )
}