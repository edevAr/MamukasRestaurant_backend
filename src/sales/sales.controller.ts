import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto, UpdateSaleItemStatusDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RestaurantsService } from '../restaurants/restaurants.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  private async getRestaurantId(user: any): Promise<string> {
    if (user.restaurantId) {
      return user.restaurantId;
    }
    
    if (user.role === Role.OWNER) {
      const restaurant = await this.restaurantsService.findByOwnerId(user.id);
      if (restaurant) {
        return restaurant.id;
      }
    }
    
    throw new ForbiddenException('Restaurant ID not found for user');
  }

  @Post()
  @Roles(Role.OWNER, Role.CLIENT)
  async create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    const user = req.user;
    const restaurantId = await this.getRestaurantId(user);

    // Verificar que el usuario es vendedor (cashier) o owner/administrator
    if (user.role !== Role.OWNER && user.staffRole !== 'cashier' && user.staffRole !== 'administrator' && user.staffRole !== 'manager') {
      throw new ForbiddenException('Only cashiers, managers, administrators, or owners can create sales');
    }

    return this.salesService.create(createSaleDto, user.id, restaurantId);
  }

  @Get()
  @Roles(Role.OWNER, Role.CLIENT)
  async findAll(@Request() req, @Query('type') type?: string) {
    const user = req.user;
    const restaurantId = await this.getRestaurantId(user);

    // Si es cocinero, obtener ventas pendientes para cocina
    if (type === 'kitchen' && (user.staffRole === 'cook' || user.role === Role.OWNER || user.staffRole === 'administrator' || user.staffRole === 'manager')) {
      return this.salesService.getPendingForKitchen(restaurantId);
    }

    // Si es mesero, obtener ventas listas para entregar
    if (type === 'delivery' && (user.staffRole === 'waiter' || user.role === Role.OWNER || user.staffRole === 'administrator' || user.staffRole === 'manager')) {
      return this.salesService.getReadyForDelivery(restaurantId);
    }

    return this.salesService.findAll(restaurantId, user.id, user.role, user.staffRole);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.CLIENT)
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    const restaurantId = await this.getRestaurantId(user);

    return this.salesService.findOne(id, restaurantId, user.role, user.staffRole, user.id);
  }

  @Patch(':id/status')
  @Roles(Role.OWNER, Role.CLIENT)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateSaleStatusDto,
    @Request() req,
  ) {
    const user = req.user;
    const restaurantId = await this.getRestaurantId(user);

    return this.salesService.updateStatus(id, updateDto, restaurantId, user.role, user.staffRole);
  }

  @Patch(':id/items/:itemId/status')
  @Roles(Role.OWNER, Role.CLIENT)
  async updateItemStatus(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateSaleItemStatusDto,
    @Request() req,
  ) {
    const user = req.user;
    const restaurantId = await this.getRestaurantId(user);

    updateDto.saleItemId = itemId;
    return this.salesService.updateItemStatus(id, updateDto, restaurantId, user.role, user.staffRole);
  }
}
