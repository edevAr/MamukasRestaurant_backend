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
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  create(@Body() createMenuDto: CreateMenuDto, @Request() req) {
    return this.menusService.create(createMenuDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('date') date?: string,
    @Query('type') type?: string,
  ) {
    let dateObj: Date | undefined;
    if (date) {
      // Parsear la fecha como string YYYY-MM-DD y crear Date en UTC para evitar problemas de zona horaria
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(Date.UTC(year, month - 1, day));
      console.log(`📅 Parsed date: ${date} -> ${dateObj.toISOString()}`);
    }
    return this.menusService.findAll(restaurantId, dateObj, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @Request() req,
  ) {
    return this.menusService.update(id, updateMenuDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.menusService.remove(id, req.user.id, req.user.role);
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  updateAvailability(
    @Param('id') id: string,
    @Body() body: { available: boolean; quantity?: number },
  ) {
    return this.menusService.updateAvailability(id, body.available, body.quantity);
  }

  @Post(':id/promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  promote(@Param('id') id: string) {
    return this.menusService.promote(id);
  }

  @Post(':id/unpromote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  unpromote(@Param('id') id: string) {
    return this.menusService.unpromote(id);
  }
}

