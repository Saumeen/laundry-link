import NextAuth, { SessionStrategy, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
      name: "credentials",
      credentials: {
        username: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
        name: { label: "Full Name", type: "text", placeholder: "John Smith" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Try to find the user by email
        let user = await prisma.customer.findUnique({
          where: { email: credentials.username }
        });

        if (user) {
          // User exists, check password
          if (!user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          return {
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
          };
        } else {
          // User does not exist, create new user
          if (!credentials.name) return null;
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

          return {
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email 
          };
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
      if (account?.provider === "credentials"||account?.provider === "google" || account?.provider === "facebook" || account?.provider === "apple") {
        try {
          // Get or create customer record
          let customer = await prisma.customer.findUnique({
            where: { email: token.email! }
          });

          if (customer) {
            // Add customer data to token
            token.customerId = customer.id;
            token.walletBalance = customer.walletBalance;
          }
        } catch (error) {
          console.error('Error updating JWT token:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.customerId) {
        session.customerId = token.customerId as number;
        session.walletBalance = token.walletBalance as number;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

