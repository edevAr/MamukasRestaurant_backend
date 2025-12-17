import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  create(@Body() createRestaurantDto: CreateRestaurantDto, @Request() req) {
    return this.restaurantsService.create(createRestaurantDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
  ) {
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    const rad = radius ? parseFloat(radius) : undefined;
    return this.restaurantsService.findAll(lat, lng, rad);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @Request() req,
  ) {
    return this.restaurantsService.update(id, updateRestaurantDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.restaurantsService.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  activate(@Param('id') id: string) {
    return this.restaurantsService.activate(id);
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.restaurantsService.deactivate(id);
  }

  @Post(':id/promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  promote(@Param('id') id: string) {
    return this.restaurantsService.promote(id);
  }

  @Post(':id/unpromote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  unpromote(@Param('id') id: string) {
    return this.restaurantsService.unpromote(id);
  }

  @Patch(':id/opening-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  updateOpeningHours(
    @Param('id') id: string,
    @Body() body: { openingHours: any },
    @Request() req,
  ) {
    return this.restaurantsService.updateOpeningHours(id, body.openingHours, req.user.id);
  }

  @Post(':id/toggle-open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  toggleOpenStatus(@Param('id') id: string, @Request() req) {
    console.log(`🎯 Controller: toggle-open endpoint called - Restaurant ID: ${id}, User ID: ${req.user.id}`);
    return this.restaurantsService.toggleOpenStatus(id, req.user.id);
  }
}

