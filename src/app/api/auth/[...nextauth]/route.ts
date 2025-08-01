import NextAuth, { SessionStrategy, NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/global';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'customer-credentials',
      name: 'customer-credentials',
      credentials: {
        username: {
          label: 'Email',
          type: 'text',
          placeholder: 'jsmith@example.com',
        },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Full Name', type: 'text', placeholder: 'John Smith' },
        phoneNumber: {
          label: 'Phone Number',
          type: 'text',
          placeholder: '+973 3344 0841',
        },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Try to find the user by email
        let user = await prisma.customer.findUnique({
          where: { email: credentials.username },
        });

        if (user) {
          // User exists, check password
          if (!user.password) {
            return null;
          }
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) return null;

          // Update phone number if provided and different
          if (
            credentials.phoneNumber &&
            user.phone !== credentials.phoneNumber
          ) {
            await prisma.customer.update({
              where: { id: user.id },
              data: { phone: credentials.phoneNumber },
            });
          }

          const result = {
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            userType: 'customer' as const,
          };
          return result;
        } else {
          // If user doesn't exist, create new user (registration)
          if (credentials.name && credentials.phoneNumber) {
            // Check if phone number already exists
            const existingPhoneUser = await prisma.customer.findFirst({
              where: {
                phone: credentials.phoneNumber,
                isActive: true,
              },
            });

            if (existingPhoneUser) {
              console.error(
                'Phone number already exists:',
                credentials.phoneNumber
              );
              return null;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(credentials.password, 10);

            // Create new user
            user = await prisma.customer.create({
              data: {
                email: credentials.username,
                password: hashedPassword,
                firstName: credentials.name.split(' ')[0] || '',
                lastName: credentials.name.split(' ').slice(1).join(' ') || '',
                phone: credentials.phoneNumber,
                isActive: true,
              },
            });
          } else {
            return null;
          }

          const result = {
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            userType: 'customer' as const,
          };
          return result;
        }
      },
    }),
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'admin-credentials',
      credentials: {
        username: {
          label: 'Email',
          type: 'text',
          placeholder: 'admin@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Find admin user by email
          const staff = await prisma.staff.findUnique({
            where: { email: credentials.username },
            include: {
              role: true,
            },
          });

          if (!staff || !staff.isActive) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            staff.password
          );

          if (!isValidPassword) {
            return null;
          }

          // Update last login time
          await prisma.staff.update({
            where: { id: staff.id },
            data: { lastLoginAt: new Date() },
          });

          const user = {
            id: staff.id.toString(),
            name: `${staff.firstName} ${staff.lastName}`,
            email: staff.email,
            userType: 'admin' as const,
            role: staff.role.name as UserRole,
            isActive: staff.isActive,
          };

          return user;
        } catch (error) {
          console.error('Admin credentials provider error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider === 'google' ||
        account?.provider === 'facebook' ||
        account?.provider === 'apple'
      ) {
        try {
          // Check if customer already exists
          let customer = await prisma.customer.findUnique({
            where: { email: user.email! },
          });

          if (!customer) {
            // Create new customer record
            customer = await prisma.customer.create({
              data: {
                email: user.email!,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                phone: null, // OAuth users don't have phone number initially
                isActive: true,
              },
            });
          }

          return true;
        } catch (error) {
          console.error('Error creating customer during OAuth sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Add user type and role to token
        token.userType = user.userType;
        if (user.userType === 'admin') {
          token.role = user.role;
          token.isActive = user.isActive;
          token.adminId = user.id ? parseInt(user.id) : undefined;
        } else if (user.userType === 'customer' && user.id) {
          // For customer credentials, the user.id is the customer ID
          token.customerId = parseInt(user.id);
        }
      }

      // Handle OAuth users (Google, Facebook, Apple) - they don't have userType set initially
      if (
        account?.provider &&
        (account.provider === 'google' ||
          account.provider === 'facebook' ||
          account.provider === 'apple')
      ) {
        if (!token.userType) {
          token.userType = 'customer';
        }
      }

      // Only fetch customer data if we don't already have customerId
      if (token.userType === 'customer' && !token.customerId) {
        try {
          // Get customer record
          const customer = await prisma.customer.findUnique({
            where: { email: token.email! },
          });

          if (customer) {
            // Add customer data to token
            token.customerId = customer.id;
          }
        } catch (error) {
          console.error('Error updating JWT token:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user type and role to session
      session.userType = token.userType as 'admin' | 'customer';

      if (token.userType === 'admin') {
        session.role = token.role as UserRole;
        session.isActive = token.isActive as boolean;
        session.adminId = token.adminId as number;
      } else if (token.userType === 'customer') {
        session.customerId = token.customerId as number;
      }

      return session;
    },
  },
  pages: {
    signIn: '/registerlogin',
    error: '/registerlogin',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

// Add error handling wrapper
const wrappedHandler = async (req: Request, context: any) => {
  try {
    return await handler(req, context);
  } catch (error) {
    console.error('NextAuth handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
