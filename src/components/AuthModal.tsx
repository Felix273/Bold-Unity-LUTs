import AuthForm from './AuthForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10"
        >
          ×
        </button>
        <AuthForm />
      </div>
    </div>
  )
}
