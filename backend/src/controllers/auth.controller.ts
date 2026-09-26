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
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User with this email not found.' });
      }

      // Generate secure 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpHash,
          otpExpiry,
          otpUsed: false,
        },
      });

      const responsePayload: any = {
        success: true,
        message: 'Password reset OTP has been generated. Valid for 15 minutes.',
      };

      // In development mode, provide OTP to assist testing without requiring an external SMTP gateway
      if (process.env.NODE_ENV !== 'production' || process.env.EXPOSE_DEV_OTP === 'true') {
        responsePayload.mockOtp = otp;
        responsePayload.devOtp = otp;
      }

      return res.json(responsePayload);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to process forgot password request.' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User with this email not found.' });
      }

      // Validate OTP presence and expiry
      if (!user.otpHash || !user.otpExpiry) {
        return res.status(400).json({ error: 'No active OTP request found. Please request a new OTP.' });
      }

      if (user.otpUsed) {
        return res.status(400).json({ error: 'This OTP has already been used. Please request a new one.' });
      }

      if (new Date() > new Date(user.otpExpiry)) {
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }

      // Verify OTP matches hashed value
      const isValidOtp = await bcrypt.compare(String(otp), user.otpHash);
      if (!isValidOtp) {
        return res.status(400).json({ error: 'Invalid OTP code provided.' });
      }

      // Hash new password and invalidate OTP
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          otpUsed: true,
          otpHash: null,
          otpExpiry: null,
        },
      });

      // Audit log entry
      const { AuditService } = await import('../services/audit.service');
      await AuditService.log({
        userId: user.id,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
        metadata: { email: user.email },
      });

      return res.json({ success: true, message: 'Password has been successfully updated.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to reset password.' });
    }
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
