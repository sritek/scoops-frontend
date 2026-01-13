/**
 * User API Types
 * Matches backend GET /users response
 */

export type UserRole = "admin" | "teacher" | "accounts" | "staff";

/**
 * User entity from API
 */
export interface UserEntity {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  orgId: string;
  branchId: string;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create user input
 */
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: UserRole;
  branchId?: string;
}

/**
 * Update user input
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Create user response (includes temp password)
 */
export interface CreateUserResponse extends UserEntity {
  tempPassword: string;
}
