'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  // Debounce the search to prevent excessive server requests while typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (query) {
         params.set('q', query)
      } else {
         params.delete('q')
      }
      
      // Update the URL without reloading the page, which triggers the Server Component to re-fetch Prisma
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 400) // 400ms delay

    return () => clearTimeout(delayDebounceFn)
  }, [query, router, searchParams])

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
         <Search size={16} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 10px 10px 36px',
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
          color: 'var(--text-color)',
          fontSize: '14px'
        }}
      />
    </div>
  )
}
