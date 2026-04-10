import { z } from 'zod';
import { RoleType, UserStatus, UserSchema } from './auth';

export { RoleType, UserStatus, UserSchema };

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  title: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  roleType: RoleType.default('member'),
  status: UserStatus.default('active'),
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  title: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  roleType: RoleType.optional(),
  status: UserStatus.optional(),
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
