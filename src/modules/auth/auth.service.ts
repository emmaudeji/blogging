// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { RegisterInput, LoginInput } from "./auth.validation";
import { ConflictError, UnauthorizedError } from "../../utils/errors";
import { notificationService } from "../notifications/notification.service";
import { NotificationTypes } from "../notifications/notification.types";

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

    // Send a welcome notification to the new account
    await notificationService.create(
      user.id,
      NotificationTypes.ACCOUNT_WELCOME,
      "Welcome to the blog",
      "Your account has been created successfully.",
      {}
    );

    // Notify all admins about new signup (small/blog-scale default; can be disabled later)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notificationService.create(
          admin.id,
          NotificationTypes.ADMIN_NEW_USER_REGISTERED,
          "New user registered",
          `A new user has signed up with email ${user.email}.`,
          { userId: user.id, email: user.email }
        )
      )
    );

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) throw new UnauthorizedError("Invalid email or password");

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) throw new UnauthorizedError("Invalid email or password");

    // Notify admins about a successful login (can be throttled or disabled in larger deployments)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notificationService.create(
          admin.id,
          NotificationTypes.ADMIN_USER_LOGIN,
          "User login",
          `User ${user.email} has logged in.`,
          { userId: user.id, email: user.email }
        )
      )
    );

    return user;
  }
}

export const authService = new AuthService();
