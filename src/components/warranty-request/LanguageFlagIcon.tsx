interface LanguageFlagIconProps {
  language: 'ko' | 'en'
  className?: string
}

const iconClassName =
  'h-7 w-7 shrink-0 object-contain brightness-0 invert transition-all duration-200'

export function LanguageFlagIcon({ language, className = '' }: LanguageFlagIconProps) {
  const isKorean = language === 'ko'
  const label = isKorean ? '국문' : '영문'

  return (
    <img
      src={isKorean ? '/icons/lang-ko.png' : '/icons/lang-en.png'}
      alt={label}
      draggable={false}
      className={`${iconClassName} ${className}`.trim()}
    />
  )
}

export function LanguageAttachmentLabel({ language }: { language: 'ko' | 'en' }) {
  const label = language === 'ko' ? '국문' : '영문'

  return (
    <span className="inline-flex items-center gap-2">
      <LanguageFlagIcon language={language} />
      {label}
    </span>
  )
}
