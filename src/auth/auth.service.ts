import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log(`🔍 validateUser called with email: "${email}"`);
    
    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`📧 Normalized email: "${normalizedEmail}"`);
    
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      console.log(`❌ User not found for email: "${normalizedEmail}"`);
      return null;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user.id}, Role: ${user.role}, StaffRole: ${user.staffRole}, Active: ${user.isActive})`);
    
    // Check if user has a password set
    if (!user.password) {
      console.log(`❌ User has no password set`);
      return null;
    }
    
    console.log(`🔐 Password exists, length: ${user.password.length}`);
    
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`🔑 Password comparison result: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (isPasswordValid) {
        // Check if user is active
        if (user.isActive === false) {
          console.log(`⚠️ User account is blocked`);
          return null;
        }
        
        const { password, ...result } = user;
        console.log(`✅ User validated successfully: ${result.email}`);
        return result;
      }
    } catch (error) {
      // If bcrypt.compare fails (e.g., invalid hash), return null
      console.error(`❌ Error comparing password:`, error);
      return null;
    }
    
    console.log(`❌ Password validation failed`);
    return null;
  }

  async login(user: any) {
    // User is already validated by LocalStrategy
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active (if isActive field exists)
    if (user.isActive === false) {
      throw new UnauthorizedException('User account is blocked');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        staffRole: user.staffRole || null,
        restaurantId: user.restaurantId || null,
      },
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }
}

