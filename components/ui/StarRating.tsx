'use client'

import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StarRatingProps {
  value: number        // 0 to 5
  onChange?: (val: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 16, md: 24, lg: 32 }

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const iconSize = sizeMap[size]

  return (
    <div className="flex gap-0.5" role="radiogroup">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          aria-checked={star === value ? 'true' : 'false'}
          disabled={readonly || !onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            size={iconSize}
            className={cn(
              'transition-colors',
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-slate-700 text-slate-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}