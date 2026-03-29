'use client'

import { useState } from 'react'
import { Camera, Upload, Loader2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePhotoUploader({ customerId, initialPhotoUrl }: { customerId: string, initialPhotoUrl: string | null }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(initialPhotoUrl)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      // 1. Upload to Vercel Blob Avatar Route
      const res = await fetch(`/api/upload-photo?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      })
      
      const { url, error } = await res.json()
      if (error) throw new Error(error)

      // 2. Patch Customer DB with the new avatar URL
      await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: url }),
      })

      router.refresh()
    } catch (error: any) {
      console.error('Failed to upload photo:', error)
      alert(`Avatar System offline: ${error.message || String(error)}. Try hard refreshing your cache.`)
      setPreview(initialPhotoUrl) // revert
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'var(--surface-color)',
        border: '4px solid var(--surface-hover)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {preview ? (
          <img 
            src={preview.startsWith('data:') ? preview : `/api/avatar?url=${encodeURIComponent(preview)}`} 
            alt="Customer Avatar" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              // Fallback in case the Proxy fails
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYTliMGJiIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE5IDIxdi0yYTRgNCAwIDAgMC00LTRINWE0IDQgMCAwIDAtNCA0djIiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiPjwvY2lyY2xlPjwvc3ZnPg=='; // Raw User Lucide Icon fallback
            }}
          />
        ) : (
          <User size={48} color="var(--text-secondary)" />
        )}

        {isUploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="lucide-spin" size={24} color="#fff" />
          </div>
        )}
      </div>

      <label style={{
        position: 'absolute',
        bottom: '0',
        right: '48px', // Positioned left of the camera
        background: 'var(--surface-color)',
        color: 'var(--text-secondary)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s',
        opacity: isUploading ? 0.5 : 1,
        pointerEvents: isUploading ? 'none' : 'auto'
      }} className="hover-scale" title="Upload from Gallery">
        <Upload size={16} />
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>

      <label style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        background: 'var(--primary-color)',
        color: '#1a1f2c',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s',
        opacity: isUploading ? 0.5 : 1,
        pointerEvents: isUploading ? 'none' : 'auto'
      }} className="hover-scale" title="Take Photo">
        <Camera size={18} />
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          style={{ display: 'none' }} 
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale:hover { transform: scale(1.1); }
        .lucide-spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  )
}
