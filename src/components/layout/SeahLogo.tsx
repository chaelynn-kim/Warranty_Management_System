interface SeahLogoProps {
  className?: string
}

export function SeahLogo({ className = 'h-7 w-auto' }: SeahLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 176 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SeAH Coated Metal"
      role="img"
    >
      {/* orange chevron above 'e' */}
      <path
        d="M14.5 2.2L16.8 5.2L19.1 2.2"
        stroke="#E8574A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="0"
        y="19.5"
        fill="white"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="17.5"
        fontWeight="700"
        letterSpacing="-0.3"
      >
        SeAH
      </text>
      <text
        x="58"
        y="19.5"
        fill="white"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="15"
        fontWeight="400"
        letterSpacing="0"
      >
        Coated Metal
      </text>
    </svg>
  )
}
