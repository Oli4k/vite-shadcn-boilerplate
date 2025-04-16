import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface VerificationCodeInputProps {
  onChange: (code: string) => void
  className?: string
  length?: number
}

export function VerificationCodeInput({
  onChange,
  className,
  length = 6,
}: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    // Notify parent component of code changes
    onChange(code.join(''))
  }, [code, onChange])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Move to next input if a digit was entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    
    // Only allow numbers
    const numbersOnly = pastedData.replace(/\D/g, '')
    
    // If the pasted data is the correct length, distribute it
    if (numbersOnly.length === length) {
      const newCode = numbersOnly.split('')
      setCode(newCode)
      
      // Focus the last input
      inputRefs.current[length - 1]?.focus()
    }
  }

  const handleAutoFill = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const value = target.value

    // Check if this is an autofill event (value length > 1)
    if (value.length > 1) {
      // Only allow numbers
      const numbersOnly = value.replace(/\D/g, '')
      
      // If we have a complete code, distribute it
      if (numbersOnly.length === length) {
        const newCode = numbersOnly.split('')
        setCode(newCode)
        
        // Focus the last input
        inputRefs.current[length - 1]?.focus()
      }
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onInput={handleAutoFill}
          className="w-10 h-10 text-center text-lg"
          autoComplete="one-time-code"
          data-index={index}
        />
      ))}
    </div>
  )
} 