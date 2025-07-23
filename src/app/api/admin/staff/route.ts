import { NextResponse } from "next/server";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse, createAdminForbiddenErrorResponse, canManageRole } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/global";

// Define the request body type
interface CreateStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  phone?: string;
}

interface UpdateStaffRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
}

export async function POST(req: Request) {
  try {  
    // Check if the current user is an authenticated admin
    const currentAdmin = await requireAuthenticatedAdmin();

    const { email, firstName, lastName, password, role, phone }: CreateStaffRequest = await req.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !role) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if current admin can create this role
    if (!canManageRole(currentAdmin.role, role as UserRole)) {
      return NextResponse.json(
        { error: `You don't have permission to create ${role} users` },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Get the role ID
    const roleRecord = await prisma.role.findUnique({
      where: { name: role }
    });

    if (!roleRecord) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the staff member
    const newStaff = await prisma.staff.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: hashedPassword,
        roleId: roleRecord.id,
        phone: phone || null,
        isActive: true
      },
      include: {
        role: true
      }
    });

    return NextResponse.json({
      message: "Staff member created successfully",
      staff: {
        id: newStaff.id,
        email: newStaff.email,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        role: newStaff.role.name,
        isActive: newStaff.isActive,
        createdAt: newStaff.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Check if the current user is an authenticated admin
    const currentAdmin = await requireAuthenticatedAdmin();

    // Parse query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Get manageable roles for the current admin
    const manageableRoles = await prisma.role.findMany({
      where: {
        name: {
          in: ['SUPER_ADMIN', 'OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'].filter(role => 
            canManageRole(currentAdmin.role, role as UserRole)
          )
        }
      }
    });

    // Build where clause for filtering
    const where: any = {
      roleId: {
        in: manageableRoles.map((role: any) => role.id)
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add role filter
    if (role) {
      const roleRecord = manageableRoles.find((r: any) => r.name === role);
      if (roleRecord) {
        where.roleId = roleRecord.id;
      }
    }

    // Add status filter
    if (status) {
      where.isActive = status === 'active';
    }

    // Get total count for pagination
    const total = await prisma.staff.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Get staff members with pagination
    const staffMembers = await prisma.staff.findMany({
      where,
      include: {
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      staff: staffMembers.map((staff: any) => ({
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role.name,
        isActive: staff.isActive,
        lastLoginAt: staff.lastLoginAt,
        createdAt: staff.createdAt,
        phone: staff.phone
      })),
      manageableRoles: manageableRoles.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });
  } catch (error) {
    console.error("Error fetching staff members:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff members" },
      { status: 500 }
    );
  }
} 

export async function DELETE(req: Request) {
  try {
    // Check if the current user is an authenticated admin
    const currentAdmin = await requireAuthenticatedAdmin();

    // Get the staff member ID from the URL
    const url = new URL(req.url);
    const staffId = url.searchParams.get('id');

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff member ID is required" },
        { status: 400 }
      );
    }

    // Get the staff member to check permissions
    const staffMember = await prisma.staff.findUnique({
      where: { id: parseInt(staffId) },
      include: { role: true }
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if current admin can manage this staff member's role
    if (!canManageRole(currentAdmin.role, staffMember.role.name as UserRole)) {
      return NextResponse.json(
        { error: `You don't have permission to delete ${staffMember.role.name} users` },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (staffMember.id === currentAdmin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete the staff member
    await prisma.staff.delete({
      where: { id: parseInt(staffId) }
    });

    return NextResponse.json({
      message: "Staff member deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
} 

export async function PUT(req: Request) {
  try {
    // Check if the current user is an authenticated admin
    const currentAdmin = await requireAuthenticatedAdmin();

    // Get the staff member ID from the URL
    const url = new URL(req.url);
    const staffId = url.searchParams.get('id');

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff member ID is required" },
        { status: 400 }
      );
    }

    const updateData: UpdateStaffRequest = await req.json();

    // Get the staff member to check permissions
    const staffMember = await prisma.staff.findUnique({
      where: { id: parseInt(staffId) },
      include: { role: true }
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if current admin can manage this staff member's role
    if (!canManageRole(currentAdmin.role, staffMember.role.name as UserRole)) {
      return NextResponse.json(
        { error: `You don't have permission to update ${staffMember.role.name} users` },
        { status: 403 }
      );
    }

    // Prevent admin from deactivating themselves
    if (staffMember.id === currentAdmin.id && updateData.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // If role is being updated, check if current admin can create the new role
    if (updateData.role && !canManageRole(currentAdmin.role, updateData.role as UserRole)) {
      return NextResponse.json(
        { error: `You don't have permission to assign ${updateData.role} role` },
        { status: 403 }
      );
    }

    // If email is being updated, check if it already exists
    if (updateData.email && updateData.email !== staffMember.email) {
      const existingStaff = await prisma.staff.findUnique({
        where: { email: updateData.email.toLowerCase() }
      });

      if (existingStaff) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const dataToUpdate: any = {};

    if (updateData.email !== undefined) {
      dataToUpdate.email = updateData.email.toLowerCase();
    }
    if (updateData.firstName !== undefined) {
      dataToUpdate.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      dataToUpdate.lastName = updateData.lastName;
    }
    if (updateData.phone !== undefined) {
      dataToUpdate.phone = updateData.phone || null;
    }
    if (updateData.isActive !== undefined) {
      dataToUpdate.isActive = updateData.isActive;
    }

    // Handle password update
    if (updateData.password) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 12);
    }

    // Handle role update
    if (updateData.role) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: updateData.role }
      });

      if (!roleRecord) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      dataToUpdate.roleId = roleRecord.id;
    }

    // Update the staff member
    const updatedStaff = await prisma.staff.update({
      where: { id: parseInt(staffId) },
      data: dataToUpdate,
      include: {
        role: true
      }
    });

    return NextResponse.json({
      message: "Staff member updated successfully",
      staff: {
        id: updatedStaff.id,
        email: updatedStaff.email,
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        role: updatedStaff.role.name,
        isActive: updatedStaff.isActive,
        lastLoginAt: updatedStaff.lastLoginAt,
        createdAt: updatedStaff.createdAt,
        phone: updatedStaff.phone
      }
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
} 