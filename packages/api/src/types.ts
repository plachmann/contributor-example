import { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
