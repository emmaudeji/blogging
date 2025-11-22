// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { RegisterInput, LoginInput } from "./auth.validation";
import { ConflictError, UnauthorizedError } from "../../utils/errors";

export class AuthService {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError("Email already in use");
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: "READER", // match Prisma Role enum value
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) throw new UnauthorizedError("Invalid email or password");

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) throw new UnauthorizedError("Invalid email or password");

    return user;
  }
}

export const authService = new AuthService();
