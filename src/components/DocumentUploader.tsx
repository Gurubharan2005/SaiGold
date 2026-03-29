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
    } catch (error: any) {
      console.error('File upload error:', error)
      alert(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select Document Type</label>
      <select 
        value={documentType} 
        onChange={(e) => setDocumentType(e.target.value)}
        disabled={isUploading}
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-color)' }}
      >
        <option value="Aadhaar">Aadhaar Card</option>
        <option value="PAN">PAN Card</option>
        <option value="Gold Photo">Gold Photo</option>
        <option value="Agreement">Agreement</option>
        <option value="Other">Other Document</option>
      </select>

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
        {isUploading ? 'Uploading to Folder...' : 'Attach File'}
      </label>
    </div>
  )
}
