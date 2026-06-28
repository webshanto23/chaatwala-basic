"use client"

import { useState } from "react"

interface ReadMoreTextProps {
  text: string
  limit?: number
  className?: string
}

export default function ReadMoreText({
  text,
  limit = 100,
  className = "",
}: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false)

  const isLong = text.length > limit

  const displayText = expanded
    ? text
    : text.slice(0, limit) + (isLong ? "..." : "")

  return (
    <p className={className}>
      {displayText}

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-primary font-medium hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </p>
  )
}