import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from './prisma';
import { UserRole } from '@/types/global';
import bcrypt from 'bcryptjs';

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
}

/**
 * Get the authenticated admin user from the server session
 * This should be used in API routes and server components
 */
export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.userType !== "admin") {
      return null;
    }

    const staff = await prisma.staff.findUnique({
      where: { email: session.user.email },
      include: {
        role: true
      }
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
      lastLoginAt: staff.lastLoginAt || undefined
    };
  } catch (error) {
    console.error('Error getting authenticated admin:', error);
    return null;
  }
}

/**
 * Validate that an admin is authenticated and return the admin data
 * Throws an error if not authenticated
 */
export async function requireAuthenticatedAdmin(): Promise<AdminUser> {
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
export async function requireAdminRole(requiredRole: UserRole): Promise<AdminUser> {
  const admin = await requireAuthenticatedAdmin();
  
  if (admin.role !== requiredRole) {
    throw new Error('Insufficient permissions');
  }
  
  return admin;
}

/**
 * Role hierarchy - defines which roles can create/manage which other roles
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  'SUPER_ADMIN': ['SUPER_ADMIN', 'OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'],
  'OPERATION_MANAGER': ['OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'],
  'DRIVER': ['DRIVER'],
  'FACILITY_TEAM': ['FACILITY_TEAM']
};

/**
 * Check if an admin can create/manage a specific role
 */
export function canManageRole(adminRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[adminRole]?.includes(targetRole) || false;
}

/**
 * Get all roles that an admin can create/manage
 */
export function getManageableRoles(adminRole: UserRole): UserRole[] {
  return ROLE_HIERARCHY[adminRole] || [];
}

/**
 * Validate that an admin can create/manage a specific role
 * Throws an error if not authorized
 */
export function validateRoleManagement(adminRole: UserRole, targetRole: UserRole): void {
  if (!canManageRole(adminRole, targetRole)) {
    throw new Error(`You don't have permission to manage ${targetRole} role`);
  }
}

export function hasPermission(userRole: UserRole, requiredPermission: string): boolean {
  const rolePermissions: Record<UserRole, string[]> = {
    'SUPER_ADMIN': [
      'orders:read', 'orders:write', 'orders:delete',
      'customers:read', 'customers:write', 'customers:delete',
      'staff:read', 'staff:write', 'staff:delete',
      'reports:read', 'reports:write',
      'settings:read', 'settings:write',
      'roles:read', 'roles:write', 'roles:delete',
      'admin:create', 'admin:manage'
    ],
    'OPERATION_MANAGER': [
      'orders:read', 'orders:write',
      'customers:read', 'customers:write',
      'staff:read', 'staff:write',
      'reports:read', 'reports:write',
      'settings:read',
      'admin:create:limited'
    ],
    'DRIVER': [
      'orders:read',
      'driver_assignments:read', 'driver_assignments:write',
      'customers:read'
    ],
    'FACILITY_TEAM': [
      'orders:read', 'orders:write',
      'facility_operations:read', 'facility_operations:write'
    ]
  };

  return rolePermissions[userRole]?.includes(requiredPermission) || false;
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'OPERATION_MANAGER': 'Operation Manager',
    'DRIVER': 'Driver',
    'FACILITY_TEAM': 'Facility Team'
  };
  return displayNames[role] || role;
} 

/**
 * Authenticate admin user with email and password
 * Returns admin user data if credentials are valid, null otherwise
 */
export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  try {
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: {
        role: true
      }
    });

    if (!staff || !staff.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, staff.password);
    
    if (!isValidPassword) {
      return null;
    }

    // Update last login time
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role.name as UserRole,
      isActive: staff.isActive,
      lastLoginAt: staff.lastLoginAt || undefined
    };
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return null;
  }
} 