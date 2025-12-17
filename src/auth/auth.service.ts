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
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    
    // Check if user has a password set
    if (!user.password) {
      return null;
    }
    
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    } catch (error) {
      // If bcrypt.compare fails (e.g., invalid hash), return null
      return null;
    }
    
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

