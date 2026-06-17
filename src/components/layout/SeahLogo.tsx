interface SeahLogoProps {
  className?: string
}

export function SeahLogo({ className = 'h-8 w-auto' }: SeahLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 196 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SeAH Coated Metal"
      role="img"
    >
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
        fill="#FFFFFF"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="17.5"
        fontWeight="700"
        letterSpacing="-0.3"
      >
        SeAH
      </text>
      <text
        x="54"
        y="19.5"
        fill="#B8BEC8"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="14.5"
        fontWeight="400"
        letterSpacing="0.1"
      >
        Coated Metal
      </text>
    </svg>
  )
}
