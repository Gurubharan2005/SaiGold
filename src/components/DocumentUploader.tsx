'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DocumentUploader({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const response = await fetch(
        `/api/upload?customerId=${customerId}&filename=${file.name}`,
        {
          method: 'POST',
          body: file,
        }
      )

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      // Clear input
      if (inputFileRef.current) inputFileRef.current.value = ''

      // Refresh the page data natively
      router.refresh()
    } catch (error) {
      console.error('File upload error:', error)
      alert("Failed to upload the file. Need to verify Vercel Blob settings.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ marginTop: '16px' }}>
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
          padding: '10px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.7 : 1
        }}
      >
        {isUploading ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <UploadCloud size={18} />}
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </label>
    </div>
  )
}
