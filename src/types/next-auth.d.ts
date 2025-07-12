import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    customerId?: number
    walletBalance?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    customerId?: number
    walletBalance?: number
  }
} 