'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this document?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/upload?documentId=${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document securely')
      }

      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      style={{ background: 'none', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', color: 'var(--status-rejected)', display: 'flex', alignItems: 'center' }}
      title="Delete Document"
    >
      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  )
}
