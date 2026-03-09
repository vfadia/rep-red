import { useState, useRef, useEffect } from 'react'

interface Props {
  prescribed: number
  actual: number
  done: boolean
  onChange: (actual: number, done: boolean) => void
}

export default function SetButton({ prescribed, actual, done, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(actual.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function handleTap() {
    if (!done) {
      onChange(prescribed, true)
    } else {
      setInputVal(actual.toString())
      setEditing(true)
    }
  }

  function handleInputBlur() {
    const num = parseInt(inputVal, 10)
    setEditing(false)
    if (isNaN(num) || num <= 0) {
      onChange(prescribed, false)
    } else {
      onChange(num, true)
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') inputRef.current?.blur()
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        min={0}
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        className="w-14 h-14 rounded-xl text-center text-lg font-bold outline-none"
        style={{
          background: 'var(--color-surface-overlay)',
          color: 'var(--color-text-primary)',
          border: '2px solid var(--color-accent)',
        }}
      />
    )
  }

  const isDoneEdited = done && actual !== prescribed
  const bgColor = !done
    ? 'var(--color-surface-overlay)'
    : isDoneEdited
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(34, 197, 94, 0.15)'
  const textColor = !done
    ? 'var(--color-text-muted)'
    : isDoneEdited
      ? 'var(--color-warning)'
      : 'var(--color-success)'
  const borderColor = !done
    ? 'var(--color-border)'
    : isDoneEdited
      ? 'rgba(245, 158, 11, 0.4)'
      : 'rgba(34, 197, 94, 0.4)'

  return (
    <button
      onClick={handleTap}
      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
      style={{ background: bgColor, border: `2px solid ${borderColor}` }}
      aria-label={`Set ${done ? 'done' : 'idle'}: ${done ? actual : prescribed} reps`}
    >
      <span className="text-lg font-bold leading-none" style={{ color: textColor }}>
        {done ? actual : prescribed}
      </span>
      {done && (
        <span className="text-xs leading-none opacity-70" style={{ color: textColor }}>✓</span>
      )}
    </button>
  )
}
