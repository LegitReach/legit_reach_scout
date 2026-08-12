import { useId } from "react";

type TriangleMarkProps = {
  className?: string;
  label?: string;
};

export function TriangleMark({ className, label }: TriangleMarkProps) {
  const maskId = `legitreach-triangle-${useId().replaceAll(":", "")}`;

  return (
    <svg
      className={className}
      viewBox="0 0 1024 1024"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <mask id={maskId}>
          <rect width="1024" height="1024" fill="white" />
          <line
            x1="-50"
            y1="420"
            x2="1074"
            y2="820"
            stroke="black"
            strokeWidth="58"
          />
        </mask>
      </defs>
      <polygon
        points="512,183 132,841 892,841"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
