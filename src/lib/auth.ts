import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export interface AuthenticatedCustomer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

/**
 * Get the authenticated customer from the server session
 * This should be used in API routes and server components
 */
export async function getAuthenticatedCustomer(): Promise<AuthenticatedCustomer | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
    });

    if (!customer || !customer.isActive) {
      return null;
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isActive: customer.isActive,
    };
  } catch (error) {
    logger.error('Error getting authenticated customer:', error);
    return null;
  }
}

/**
 * Validate that a customer is authenticated and return the customer data
 * Throws an error if not authenticated
 */
export async function requireAuthenticatedCustomer(): Promise<AuthenticatedCustomer> {
  const customer = await getAuthenticatedCustomer();

  if (!customer) {
    throw new Error('Authentication required');
  }

  return customer;
}

/**
 * Get customer ID from the session
 * Returns null if not authenticated
 */
export async function getCustomerId(): Promise<number | null> {
  const customer = await getAuthenticatedCustomer();
  return customer?.id || null;
}

/**
 * Validate that the authenticated customer owns a resource
 * Throws an error if not authenticated or doesn't own the resource
 */
export async function validateResourceOwnership(
  resourceCustomerId: number
): Promise<AuthenticatedCustomer> {
  const customer = await requireAuthenticatedCustomer();

  if (customer.id !== resourceCustomerId) {
    throw new Error('Access denied');
  }

  return customer;
}

/**
 * Helper function to create error responses for authentication failures
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required'
) {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper function to create error responses for authorization failures
 */
export function createForbiddenErrorResponse(
  message: string = 'Access denied'
) {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
