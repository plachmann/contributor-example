if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set in production");
}

export const JWT_SECRET = process.env.JWT_SECRET || "change-me";