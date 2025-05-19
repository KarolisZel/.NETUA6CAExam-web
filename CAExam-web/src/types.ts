/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface Option<T> {
  value: T;
  label: string;
}

export interface PaginatedResult<T> {
  limit: number;
  offset: number;
  total: number;
  result: T[];
}

// This type matches the GetPersonDto from the backend
export interface GetPerson {
  id: string;
  firstName: string;
  lastName: string;
  personCode: string;
  phoneNumber: string;
  email: string;
  profilePhotoId: string;
  residenceId: string;
  userId: string;
}

// Full Person type with nested objects (for update operations)
export interface Person extends GetPerson {
  profilePhoto: ProfilePhoto;
  residence: Residence;
}

// This type matches the GetResidenceDto from the backend
export interface GetResidence {
  id: string;
  country: string;
  city: string;
  street: string;
  streetNumber: number;
  apartmentNumber: number | null;
}

// Full Residence type (for update operations if needed)
export interface Residence extends GetResidence {}

export interface ProfilePhoto {
  id: string;
  name: string;
  extension: string;
  size: bigint;
  bytes: Array<number>;
}

export const RoleTypes = ["User", "Admin"] as const;
export type RoleType = (typeof RoleTypes)[number];
export const RoleOptions: Option<RoleType>[] = RoleTypes.map((item) => ({
  value: item,
  label: item,
}));
