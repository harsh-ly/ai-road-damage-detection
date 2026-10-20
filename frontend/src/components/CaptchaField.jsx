import { useEffect, useState } from 'react'

function createCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const useAddition = Math.random() > 0.5

  if (useAddition) {
    return {
      question: `${a} + ${b}`,
      answer: a + b,
    }
  }

  const left = Math.max(a, b)
  const right = Math.min(a, b)

  return {
    question: `${left} - ${right}`,
    answer: left - right,
  }
}

export default function CaptchaField({ onChange }) {
  const [challenge, setChallenge] = useState(() => createCaptcha())
  const [value, setValue] = useState('')

  useEffect(() => {
    const normalized = value.trim()
    onChange({
      question: challenge.question,
      isValid: normalized !== '' && Number(normalized) === challenge.answer,
      value: normalized,
    })
  }, [challenge, onChange, value])

  const refreshCaptcha = () => {
    setChallenge(createCaptcha())
    setValue('')
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        gap: '8px',
      }}>
        <label style={{
          display: 'block',
          fontFamily: "'Oswald', sans-serif",
          fontSize: '11px',
          color: '#9b9a93',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Verify you are human
        </label>
        <button
          type="button"
          onClick={refreshCaptcha}
          style={{
            background: 'transparent',
            border: '1px solid rgba(244,196,48,0.2)',
            color: '#f4c430',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          refresh
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(15,16,20,0.8)',
        border: '1px solid rgba(244,196,48,0.2)',
        padding: '12px 14px',
      }}>
        <div style={{
          flex: 1,
          fontFamily: "'Oswald', sans-serif",
          color: '#f4c430',
          fontSize: '18px',
          letterSpacing: '0.08em',
          fontWeight: 700,
        }}>
          {challenge.question} =
        </div>

        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="?"
          inputMode="numeric"
          style={{
            width: '90px',
            background: 'rgba(25,25,30,0.9)',
            border: '1px solid rgba(244,196,48,0.2)',
            color: '#ece9e2',
            padding: '10px 12px',
            fontSize: '14px',
            textAlign: 'center',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
