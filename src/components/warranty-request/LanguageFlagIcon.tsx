interface LanguageFlagIconProps {
  language: 'ko' | 'en'
}

export function LanguageFlagIcon({ language }: LanguageFlagIconProps) {
  const isKorean = language === 'ko'
  const label = isKorean ? '국문' : '영문'

  return (
    <img
      src={isKorean ? '/icons/flag-kr.png' : '/icons/flag-us.png'}
      alt={label}
      draggable={false}
      className="h-7 w-7 shrink-0 rounded-full object-cover transition-all duration-200 group-hover/flag:drop-shadow-[0_0_10px_rgba(59,130,246,0.85)] group-hover/flag:ring-2 group-hover/flag:ring-accent/60"
    />
  )
}
