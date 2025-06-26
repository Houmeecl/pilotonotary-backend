export type Role = "superadmin" | "notary" | "client";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
