import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@/types/global';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Get the authenticated admin from the server session
 * This should be used in admin API routes
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userType || session.userType !== 'admin') {
      return null;
    }

    if (!session.adminId || !session.role) {
      return null;
    }

    const staff = await prisma.staff.findUnique({
      where: { id: session.adminId },
      include: { role: true },
    });

    if (!staff || !staff.isActive) {
      return null;
    }

    return {
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role.name as UserRole,
      isActive: staff.isActive,
    };
  } catch (error) {
    logger.error('Error getting authenticated admin:', error);
    return null;
  }
}

/**
 * Validate that an admin is authenticated and return the admin data
 * Throws an error if not authenticated
 */
export async function requireAuthenticatedAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    throw new Error('Admin authentication required');
  }

  return admin;
}

/**
 * Validate that an admin has a specific role
 * Throws an error if not authenticated or doesn't have the required role
 */
export async function requireAdminRole(
  requiredRole: UserRole
): Promise<AuthenticatedAdmin> {
  const admin = await requireAuthenticatedAdmin();

  if (admin.role !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`);
  }

  return admin;
}

/**
 * Validate that an admin has one of the specified roles
 * Throws an error if not authenticated or doesn't have any of the required roles
 */
export async function requireAdminRoles(
  requiredRoles: UserRole[]
): Promise<AuthenticatedAdmin> {
  const admin = await requireAuthenticatedAdmin();

  if (!requiredRoles.includes(admin.role)) {
    throw new Error(
      `Access denied. Required roles: ${requiredRoles.join(', ')}`
    );
  }

  return admin;
}

/**
 * Helper function to create error responses for admin authentication failures
 */
export function createAdminAuthErrorResponse(
  message: string = 'Admin authentication required'
) {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper function to create error responses for admin authorization failures
 */
export function createAdminForbiddenErrorResponse(
  message: string = 'Admin access denied'
) {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Role hierarchy - defines which roles can create/manage which other roles
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'],
  OPERATION_MANAGER: ['OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'],
  DRIVER: ['DRIVER'],
  FACILITY_TEAM: ['FACILITY_TEAM'],
};

/**
 * Check if an admin can create/manage a specific role
 */
export function canManageRole(
  adminRole: UserRole,
  targetRole: UserRole
): boolean {
  return ROLE_HIERARCHY[adminRole]?.includes(targetRole) || false;
}

/**
 * Get all roles that an admin can create/manage
 */
export function getManageableRoles(adminRole: UserRole): UserRole[] {
  return ROLE_HIERARCHY[adminRole] || [];
}

/**
 * Authenticate admin user with email and password
 * This should be used in admin login routes
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AuthenticatedAdmin | null> {
  try {
    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!staff || !staff.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login timestamp
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role.name as UserRole,
      isActive: staff.isActive,
    };
  } catch (error) {
    logger.error('Error authenticating admin:', error);
    return null;
  }
}
