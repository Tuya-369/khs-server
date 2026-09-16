import { ProjectName, Role } from "@prisma/client";

export type ProjectNameValue = ProjectName;

export type SendOtpResult = {
  message: string;
  debugCode?: string;
};

export type ResetTokenPayload = {
  userId: string;
  phoneNumber: string;
  purpose: string;
};

export type OtpTokenPayload = {
  userId: string;
  phoneNumber: string;
  purpose: string;
};

export type CreateUserPayload = {
  sapId?: string;
  firstName: string;
  lastName: string;
  ProjectName: ProjectNameValue;
  phoneNumber: string;
  password: string;
  role: Role;
};

export type RegisterPayload = {
  sapId?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
};

export type LoginPayload = {
  sapId?: string;
  identifier?: string;
  password: string;
};

export type LoginChallengeResult = {
  otpToken: string;
  maskedPhone: string;
  expiresIn: number;
  debugCode?: string;
};

export type UpdateMePayload = {
  firstName?: string;
  lastName?: string;
  ProjectName?: ProjectNameValue;
  phoneNumber?: string;
  profileImage?: string | null;
  profileImagePublicId?: string | null;
};

export type SessionUser = {
  id: string;
  sapId: string | null;
  role: Role;
  firstName: string;
  lastName: string;
  ProjectName: ProjectNameValue;
};
