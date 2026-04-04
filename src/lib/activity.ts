import { prisma } from './prisma'

/**
 * Activity Action Types Constants
 */
export const ACTIVITY_ACTIONS = {
  STATUS_CHANGE: 'STATUS_CHANGE',
  CALL_RECORDED: 'CALL_RECORDED',
  DOC_UPLOAD: 'DOC_UPLOAD',
  ASSIGNMENT: 'ASSIGNMENT',
  LEAD_RECEIVED: 'LEAD_RECEIVED',
  BRANCH_UPDATE: 'BRANCH_UPDATE',
  VERIFICATION: 'VERIFICATION',
}

/**
 * Logs a specific customer activity to the database.
 */
export async function logActivity(
  customerId: string, 
  action: string, 
  details?: string, 
  userId?: string
) {
  try {
    return await prisma.customerActivity.create({
      data: {
        customerId,
        action,
        details,
        userId,
      }
    })
  } catch (error) {
    console.error('[ACTIVITY_LOG_ERROR]', { customerId, action, error })
    // Non-blocking catch
    return null
  }
}
