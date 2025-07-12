import NextAuth from "next-auth"
import { UserRole } from "./global"

declare module "next-auth" {
  interface Session {
    userType?: "admin" | "customer"
    customerId?: number
    walletBalance?: number
    adminId?: number
    role?: UserRole
    isActive?: boolean
  }

  interface User {
    id?: string
    userType?: "admin" | "customer"
    role?: UserRole
    isActive?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: "admin" | "customer"
    customerId?: number
    walletBalance?: number
    adminId?: number
    role?: UserRole
    isActive?: boolean
  }
} 