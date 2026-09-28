/** Displacement map for the hand-drawn UI style. */
export function HandDrawnFilter() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute" }}
    >
      <filter id="hand-drawn" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="turbulence"
          baseFrequency="0.03"
          numOctaves={2}
          seed={4}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="0.6" result="soft" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale={2}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
