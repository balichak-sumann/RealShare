import prisma from './prisma';

export async function logAdminAction(
  employeeId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        employee_id: employeeId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      },
    });
  } catch (err) {
    console.error('[Audit Log Error]: Failed to record action', err);
  }
}
