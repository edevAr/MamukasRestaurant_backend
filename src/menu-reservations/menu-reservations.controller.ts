import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MenuReservationsService } from './menu-reservations.service';
import { CreateMenuReservationDto } from './dto/create-menu-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { MenuReservationStatus } from './entities/menu-reservation.entity';

@Controller('menu-reservations')
@UseGuards(JwtAuthGuard)
export class MenuReservationsController {
  constructor(private readonly menuReservationsService: MenuReservationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  create(@Body() createMenuReservationDto: CreateMenuReservationDto, @Request() req) {
    return this.menuReservationsService.create(createMenuReservationDto, req.user.id);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('restaurantId') restaurantId?: string,
    @Query('menuId') menuId?: string,
    @Query('date') date?: string,
  ) {
    if (req.user.role === Role.CLIENT) {
      return this.menuReservationsService.findAll(undefined, req.user.id);
    }
    return this.menuReservationsService.findAll(restaurantId);
  }

  @Get('check')
  async checkReservation(
    @Request() req,
    @Query('menuId') menuId: string,
    @Query('date') date: string,
  ) {
    if (req.user.role !== Role.CLIENT) {
      return null;
    }
    return this.menuReservationsService.findByMenuAndClient(menuId, req.user.id, date);
  }

  @Get('count')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  getReservationCount(
    @Query('restaurantId') restaurantId: string,
    @Query('date') date?: string,
  ) {
    const dateObj = date ? new Date(date) : undefined;
    return this.menuReservationsService.getReservationCount(restaurantId, dateObj);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req) {
    return this.menuReservationsService.cancel(id, req.user.id, req.user.role);
  }

  @Post(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: MenuReservationStatus },
  ) {
    return this.menuReservationsService.updateStatus(id, body.status);
  }
}

