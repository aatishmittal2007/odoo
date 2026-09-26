import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'stocksense-enterprise-secret-key-2026';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, role = UserRole.INVENTORY_MANAGER, department } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          department,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
        token,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Registration failed.' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Audit log entry (D17)
      const { AuditService } = await import('../services/audit.service');
      await AuditService.log({
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        metadata: { email: user.email, role: user.role, type: 'CREDENTIALS' },
      });

      return res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
        token,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Login failed.' });
    }
  }

  static async demoLogin(req: Request, res: Response) {
    try {
      const { role = UserRole.INVENTORY_MANAGER } = req.body;

      let user = await prisma.user.findFirst({ where: { role } });
      if (!user) {
        user = await prisma.user.findFirst();
      }

      if (!user) {
        return res.status(404).json({ error: 'No demo users found. Please seed the database.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Audit log entry (D17)
      const { AuditService } = await import('../services/audit.service');
      await AuditService.log({
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        metadata: { email: user.email, role: user.role, type: 'DEMO_1_CLICK' },
      });

      return res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
        token,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Demo login failed.' });
    }
  }

  static async logout(req: Request, res: Response) {
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    // Mock OTP response for development flow
    return res.json({
      success: true,
      message: 'Demo password reset OTP sent: 849201. Use this code to reset your password.',
      mockOtp: '849201',
    });
  }

  static async resetPassword(req: Request, res: Response) {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User with this email not found.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.json({ success: true, message: 'Password has been successfully updated.' });
  }

  static async getMe(req: any, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
      });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      return res.json({ user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, department: true },
        orderBy: { name: 'asc' },
      });
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
