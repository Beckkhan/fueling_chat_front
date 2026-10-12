import type { ReactNode } from "react"
import type { IconName } from "../types"

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    attach: <path d="m9 17 7.5-7.5a3.5 3.5 0 0 0-5-5L4 12a5 5 0 0 0 7 7l7.5-7.5" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    send: <path d="m3 11 18-8-7 18-3-7-8-3Zm8 3 4-4" />,
    spark: (
      <>
        <path d="M12 3c.5 4.2 2.8 6.5 7 7-4.2.5-6.5 2.8-7 7-.5-4.2-2.8-6.5-7-7 4.2-.5 6.5-2.8 7-7Z" />
        <path d="M19 16c.2 1.7 1.1 2.6 2.8 2.8-1.7.2-2.6 1.1-2.8 2.8-.2-1.7-1.1-2.6-2.8-2.8 1.7-.2 2.6-1.1 2.8-2.8Z" />
      </>
    ),
    stop: <rect x="7" y="7" width="10" height="10" rx="1" />,
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {paths[name]}
      </g>
    </svg>
  )
}
