import NextAuth, { SessionStrategy, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { signIn } from "next-auth/react";

export const authOptions = {
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
  ],
  session: { strategy: "jwt" as SessionStrategy },
  callbacks: {
    async signIn(params: {
        user: User 
        email?: {
          verificationRequest?: boolean
        }}){
            console.log(params);
            
        },

    async session({ session, token, user }) {
      // You can add custom session logic here
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };