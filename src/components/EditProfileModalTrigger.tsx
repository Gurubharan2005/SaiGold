'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import { CustomerEditForm } from './CustomerEditForm'

export function EditProfileModalTrigger({ customer }: { customer: any }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-secondary" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
      >
        <Edit size={18} /> Edit Profile
      </button>

      {isOpen && (
         <CustomerEditForm customer={customer} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
