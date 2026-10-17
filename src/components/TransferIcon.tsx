import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'

export type TransferDirection = 'out' | 'in' | 'swap'

type Props = {
  direction?: TransferDirection
  size?: number
  label?: string
  className?: string
}

const icons = {
  out: ArrowUpRight,
  in: ArrowDownLeft,
  swap: ArrowLeftRight,
} satisfies Record<TransferDirection, typeof ArrowUpRight>

const labels: Record<TransferDirection, string> = {
  out: 'Sent',
  in: 'Received',
  swap: 'Swap',
}

/** One transfer icon set for the whole product: consistent stroke, size and naming. */
export function TransferIcon({ direction = 'swap', size = 16, label, className = '' }: Props) {
  const Icon = icons[direction]
  const text = label ?? labels[direction]
  return (
    <span className={`transfer-icon transfer-${direction} ${className}`.trim()} role="img" aria-label={text}>
      <Icon size={size} strokeWidth={1.6} aria-hidden="true" />
    </span>
  )
}
