import NextAuth, { SessionStrategy, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/global";

export const authOptions: NextAuthOptions = {
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
      id: "customer-credentials",
      name: "customer-credentials",
      credentials: {
        username: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
        name: { label: "Full Name", type: "text", placeholder: "John Smith" }
      },
      async authorize(credentials, req) {
        console.log("Customer credentials provider called with:", { 
          email: credentials?.username,
          hasPassword: !!credentials?.password,
          hasName: !!credentials?.name
        });

        if (!credentials?.username || !credentials?.password) {
          console.log("Customer credentials provider: Missing credentials");
          return null;
        }

        // Try to find the user by email
        let user = await prisma.customer.findUnique({
          where: { email: credentials.username }
        });

        console.log("Customer credentials provider: Found user:", {
          found: !!user,
          isActive: user?.isActive,
          hasPassword: !!user?.password
        });

        if (user) {
          // User exists, check password
          if (!user.password) {
            console.log("Customer credentials provider: User exists but no password");
            return null;
          }
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          
          const result = {
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            userType: "customer" as const
          };
          return result;
        } else {
          // User does not exist, create new user
          if (!credentials.name) {
            console.log("Customer credentials provider: No name provided for new user");
            return null;
          }
          const [firstName, ...lastNameArr] = credentials.name.split(" ");
          const lastName = lastNameArr.join(" ");
          const hashedPassword = await bcrypt.hash(credentials.password, 10);

          user = await prisma.customer.create({
            data: {
              email: credentials.username,
              firstName,
              lastName,
              password: hashedPassword,
              isActive: true,
              walletBalance: 0
            }
          });

          const result = {
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            userType: "customer" as const
          };
          return result;
        }
      }
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "admin-credentials",
      credentials: {
        username: { label: "Email", type: "text", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {

        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Find admin user by email
          const staff = await prisma.staff.findUnique({
            where: { email: credentials.username },
            include: {
              role: true
            }
          });

          if (!staff || !staff.isActive) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, staff.password);

          if (!isValidPassword) {
            return null;
          }

          // Update last login time
          await prisma.staff.update({
            where: { id: staff.id },
            data: { lastLoginAt: new Date() }
          });

          const user = {
            id: staff.id.toString(),
            name: `${staff.firstName} ${staff.lastName}`,
            email: staff.email,
            userType: "admin" as const,
            role: staff.role.name as UserRole,
            isActive: staff.isActive
          };

          return user;
        } catch (error) {
          console.error("Admin credentials provider error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook" || account?.provider === "apple") {
        try {
          // Check if customer already exists
          let customer = await prisma.customer.findUnique({
            where: { email: user.email! }
          });

          if (!customer) {
            // Create new customer record
            customer = await prisma.customer.create({
              data: {
                email: user.email!,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                isActive: true,
                walletBalance: 0,
              }
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
        if (user.userType === "admin") {
          token.role = user.role;
          token.isActive = user.isActive;
          token.adminId = user.id ? parseInt(user.id) : undefined;
        }
      }

      if (account?.provider === "customer-credentials" || account?.provider === "admin-credentials" || account?.provider === "google" || account?.provider === "facebook" || account?.provider === "apple") {
        try {
          if (token.userType === "customer") {
            // Get or create customer record
            let customer = await prisma.customer.findUnique({
              where: { email: token.email! }
            });

            if (customer) {
              // Add customer data to token
              token.customerId = customer.id;
              token.walletBalance = customer.walletBalance;
            }
          }
        } catch (error) {
          console.error('Error updating JWT token:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      
      // Add user type and role to session
      session.userType = token.userType as "admin" | "customer";
      
      if (token.userType === "admin") {
        session.role = token.role as UserRole;
        session.isActive = token.isActive as boolean;
        session.adminId = token.adminId as number;
      } else if (token.userType === "customer") {
        session.customerId = token.customerId as number;
        session.walletBalance = token.walletBalance as number;
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/registerlogin',
    error: '/registerlogin',
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

