// Ilustraciones vectoriales originales y estilizadas de los monumentos reales.
export function LandmarkArt({
  cityId,
  className = "",
}: {
  cityId: string;
  className?: string;
}) {
  return (
    <svg
      className={`landmark-art ${className}`}
      viewBox="0 0 400 220"
      aria-hidden="true"
    >
      <circle cx="290" cy="64" r="43" fill="var(--sun)" />
      <path
        d="M0 185 Q100 158 200 184 T400 175 V220 H0Z"
        fill="var(--land-soft)"
      />
      <g
        fill="var(--stone)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        {cityId === "madrid" && (
          <>
            <path d="M52 184V111H348V184M136 111V92L200 57L264 92V111M130 92H270M45 184H355M46 192H354" />
            {[74, 108, 142, 176, 210, 244, 278, 312].map((x) => (
              <path key={x} d={`M${x} 124h13v49h-13z`} fill="var(--paper)" />
            ))}
            <path d="M173 93L200 76L227 93Z" fill="var(--terracotta)" />
            <path d="M50 112H350M50 119H350" />
          </>
        )}
        {cityId === "barcelona" && (
          <>
            <path d="M93 185L101 80L109 50L117 80L125 185M131 185L139 61L147 28L155 61L163 185M237 185L245 61L253 28L261 61L269 185M275 185L283 80L291 50L299 80L307 185" />
            <path d="M156 185V128L178 94L200 69L222 94L244 128V185M177 185V151Q200 117 223 151V185" />
            <path d="M200 70V38M191 47H209M89 185H311" />
            {[109, 147, 253, 291].map((x) => (
              <path key={x} d={`M${x - 3} 93v47h6V93Z`} fill="var(--ink)" />
            ))}
          </>
        )}
        {cityId === "paris" && (
          <>
            <path d="M35 177V88H365V177M39 110H361M39 137H361M40 85L55 73H345L360 85" />
            {[52, 82, 112, 142, 172, 202, 232, 262, 292, 322].map((x) => (
              <path
                key={x}
                d={`M${x} 97h13v27h-13zM${x} 145h13v26h-13z`}
                fill="var(--paper)"
              />
            ))}
            <path d="M124 191L200 103L276 191Z" fill="var(--glass)" />
            <path
              d="M200 103V191M124 191L217 122M150 160L242 154M175 132L260 174M155 191L225 132M231 191L178 129"
              fill="none"
            />
          </>
        )}
        {cityId === "rome" && (
          <>
            <path d="M58 183V84Q194 40 342 84V183Q198 204 58 183Z" />
            <path
              d="M58 113Q200 78 342 113M58 147Q200 120 342 147M59 82L119 65V52L181 44V65L242 64V75L342 84"
              fill="none"
            />
            {[77, 112, 147, 182, 217, 252, 287, 322].map((x, i) => (
              <g key={x}>
                <path
                  d={`M${x - 8} 175v-16q8-15 16 0v16zM${x - 8} 140v-17q8-15 16 0v17zM${x - 8} ${107 - (i > 1 && i < 6 ? 10 : 0)}v-16q8-15 16 0v16z`}
                  fill="var(--ink)"
                />
              </g>
            ))}
          </>
        )}
        {cityId === "new-york" && (
          <>
            <path d="M156 192V159H244V192M164 159V145H236V159M173 145L180 105L189 86L184 71L178 59L165 30L173 26L190 56L202 67L211 74L223 119L231 145Z" />
            <path
              d="M194 69L198 54L203 49L211 52L215 67M197 52L190 43M202 49L201 37M208 49L214 38M213 53L224 47M165 30L159 18L170 9L180 21L173 26"
              fill="var(--terracotta)"
            />
            <path d="M216 83L238 90L231 118L210 109ZM191 89L184 138M204 100L215 144M150 192H251" />
          </>
        )}
        {cityId === "washington" && (
          <>
            <path
              d="M176 188L184 48L200 17L216 48L224 188Z"
              fill="var(--paper)"
            />
            <path
              d="M200 17V188M184 48L200 53L216 48M181 111H219M155 188H245M139 195H261"
              fill="none"
            />
            <path
              d="M181 111L176 188H200V111Z"
              fill="var(--stone)"
              stroke="none"
            />
          </>
        )}
      </g>
      <path d="M18 202H382" stroke="var(--ink)" strokeWidth="1" opacity=".25" />
    </svg>
  );
}
