import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { Role } from '../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Set default role to client if not provided
    if (!createUserDto.role) {
      createUserDto.role = 'client' as any;
    }
    
    const user = await this.usersService.create(createUserDto);
    
    // If user is owner and has restaurant info, create restaurant
    if (user.role === Role.OWNER && createUserDto.restaurantInfo) {
      const { restaurantInfo } = createUserDto;
      
      if (restaurantInfo.name && restaurantInfo.address && 
          restaurantInfo.latitude !== undefined && restaurantInfo.longitude !== undefined) {
        const restaurant = await this.restaurantsService.create({
          name: restaurantInfo.name,
          address: restaurantInfo.address,
          latitude: restaurantInfo.latitude,
          longitude: restaurantInfo.longitude,
          image: restaurantInfo.image,
          description: `Restaurante ${restaurantInfo.name}`,
          email: user.email,
          phone: createUserDto.phone,
          isActive: false, // Restaurant needs validation
        }, user.id);
        
        // Actualizar el usuario para que tenga staffRole='administrator' y restaurantId
        user.staffRole = 'administrator';
        user.restaurantId = restaurant.id;
        await this.usersService.update(user.id, {
          staffRole: 'administrator',
          restaurantId: restaurant.id,
        });
      }
    }
    
    // Obtener el usuario actualizado con staffRole y restaurantId
    const updatedUser = await this.usersService.findOne(user.id);
    const { password, ...result } = updatedUser;
    return result;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Request() req) {
    // Obtener el usuario completo de la base de datos para incluir staffRole y restaurantId
    const fullUser = await this.usersService.findOne(req.user.id);
    const { password, ...userWithoutPassword } = fullUser;
    return { 
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName,
        lastName: userWithoutPassword.lastName,
        role: userWithoutPassword.role,
        staffRole: userWithoutPassword.staffRole || null,
        restaurantId: userWithoutPassword.restaurantId || null,
      }
    };
  }
}

