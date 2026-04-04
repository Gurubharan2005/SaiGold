'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DocumentUploader({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [documentType, setDocumentType] = useState('Aadhaar')
  const inputFileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const response = await fetch(
        `/api/upload?customerId=${customerId}&filename=${encodeURIComponent(file.name)}&documentType=${encodeURIComponent(documentType)}`,
        {
          method: 'POST',
          body: file,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      // Clear input
      if (inputFileRef.current) inputFileRef.current.value = ''
      
      router.refresh()
    } catch (error: unknown) {
      console.error('File upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="file"
        ref={inputFileRef}
        onChange={handleUpload}
        disabled={isUploading}
        style={{ display: 'none' }}
        id={`doc-upload-${customerId}`}
      />
      <label 
        htmlFor={`doc-upload-${customerId}`}
        className="btn-secondary" 
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px', 
          cursor: isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.7 : 1,
          border: '1px solid var(--primary-color)',
          background: 'rgba(255, 193, 7, 0.05)',
          color: 'var(--primary-color)',
          fontWeight: 700
        }}
      >
        {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
        {isUploading ? 'Uploading to Folder...' : 'Attach Document'}
      </label>
    </div>
  )
}
