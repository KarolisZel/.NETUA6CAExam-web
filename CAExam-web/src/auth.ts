import type { Person } from "./types";

export type AuthData = {
  token: string;
  user: UserData;
};

export const createAuthHeader = (auth: AuthData | undefined | null) => {
  // Handle old format
  if (auth && 'accessToken' in auth) {
    return {
      Authorization: `Bearer ${(auth as { accessToken: string }).accessToken}`,
    };
  }

  // Handle new format
  if (auth?.token) {
    return {
      Authorization: `Bearer ${auth.token}`,
    };
  }

  return {};
};

type Role = "User" | "Admin";

export type UserData = {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  person?: Person;
  firstTimeLogin?: boolean;
};
