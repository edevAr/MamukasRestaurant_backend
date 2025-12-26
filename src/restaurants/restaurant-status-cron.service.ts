import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { EventsService } from '../events/events.service';

@Injectable()
export class RestaurantStatusCronService {
  private readonly logger = new Logger(RestaurantStatusCronService.name);

  constructor(
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    private eventsService: EventsService,
  ) {}

  /**
   * Cron job que se ejecuta cada 50 segundos
   * Solo verifica restaurantes que tienen un cambio de estado programado
   * en el próximo minuto (hora actual a hora actual + 1 minuto)
   * Esto es mucho más eficiente que verificar todos los restaurantes
   */
  @Cron('*/50 * * * * *') // Cada 50 segundos
  async checkAndUpdateRestaurantStatus() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    this.logger.debug(`🔄 Iniciando verificación de estados (${currentTime})...`);

    try {
      // Obtener todos los restaurantes activos con horarios configurados
      const restaurants = await this.restaurantsRepository.find({
        where: { isActive: true },
        select: ['id', 'name', 'isOpen', 'openingHours'],
      });

      if (restaurants.length === 0) {
        this.logger.debug('ℹ️ No hay restaurantes activos para verificar');
        return;
      }

      // Filtrar solo restaurantes que tienen un cambio programado en el próximo minuto
      const restaurantsWithScheduledChanges = this.filterRestaurantsWithScheduledChanges(
        restaurants,
        now,
      );

      if (restaurantsWithScheduledChanges.length === 0) {
        this.logger.debug('✅ No hay restaurantes con cambios programados en el próximo minuto');
        return;
      }

      this.logger.debug(
        `📋 Verificando ${restaurantsWithScheduledChanges.length} restaurantes con cambios programados (de ${restaurants.length} totales)`,
      );

      const changes: Array<{ restaurant: Restaurant; newStatus: boolean }> = [];

      // Verificar solo los restaurantes con cambios programados
      for (const restaurant of restaurantsWithScheduledChanges) {
        const calculatedIsOpen = this.calculateIsOpenFromHours(
          restaurant.openingHours,
          now,
        );

        // Si el estado calculado es diferente al almacenado, agregar a la lista de cambios
        if (restaurant.isOpen !== calculatedIsOpen) {
          changes.push({
            restaurant,
            newStatus: calculatedIsOpen,
          });
        }
      }

      if (changes.length === 0) {
        this.logger.debug('✅ No hay cambios de estado en los restaurantes verificados');
        return;
      }

      // Contar cuántos restaurantes van a abrir y cuántos van a cerrar
      const openingCount = changes.filter((c) => c.newStatus === true).length;
      const closingCount = changes.filter((c) => c.newStatus === false).length;

      this.logger.log(
        `🔄 Se detectaron ${changes.length} restaurantes con cambio de estado: ${openingCount} van a ABRIR, ${closingCount} van a CERRAR`,
      );

      // Actualizar cada restaurante que cambió de estado
      for (const { restaurant, newStatus } of changes) {
        try {
          // Actualizar en la base de datos
          await this.restaurantsRepository.update(restaurant.id, {
            isOpen: newStatus,
          });

          // Emitir evento SSE para notificar a todos los clientes
          const message = newStatus
            ? `${restaurant.name} está ahora abierto`
            : `${restaurant.name} está ahora cerrado`;

          this.logger.log(
            `📡 Emitiendo evento SSE: ${restaurant.name} (ID: ${restaurant.id}) -> ${newStatus ? 'ABIERTO' : 'CERRADO'}`,
          );

          this.eventsService.emitRestaurantStatus(
            restaurant.id,
            newStatus,
            message,
          );
        } catch (error) {
          this.logger.error(
            `❌ Error al actualizar restaurante ${restaurant.id}:`,
            error,
          );
        }
      }

      this.logger.log(
        `✅ Verificación completada. ${changes.length} restaurante(s) actualizado(s)`,
      );
    } catch (error) {
      this.logger.error('❌ Error en la verificación de estados:', error);
    }
  }

  /**
   * Filtra restaurantes que tienen un cambio de estado programado
   * en el rango de tiempo actual a actual + 1 minuto
   */
  private filterRestaurantsWithScheduledChanges(
    restaurants: Restaurant[],
    currentTime: Date,
  ): Restaurant[] {
    const currentDay = currentTime.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const nextMinute = currentMinutes + 1;

    // Mapear día de la semana a clave de openingHours
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    const todayKey = dayMap[currentDay];

    return restaurants.filter((restaurant) => {
      const openingHours = restaurant.openingHours;
      if (!openingHours || typeof openingHours !== 'object') {
        return false;
      }

      const todayHours = openingHours[todayKey];
      if (!todayHours || !todayHours.open) {
        return false;
      }

      if (!todayHours.openTime || !todayHours.closeTime) {
        return false;
      }

      // Convertir horarios a minutos
      const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      // Verificar si la hora actual o la próxima minuto coincide exactamente con apertura o cierre
      // Solo procesar si estamos en el minuto exacto o en el siguiente minuto
      const isOpeningTime = currentMinutes === openMinutes || nextMinute === openMinutes;
      const isClosingTime = currentMinutes === closeMinutes || nextMinute === closeMinutes;

      // NO usar "near" porque eso incluiría restaurantes que aún no deben cambiar
      // Solo procesar si estamos en el minuto exacto del cambio o en el siguiente
      return isOpeningTime || isClosingTime;
    });
  }

  /**
   * Calcula si un restaurante está abierto basado en sus horarios y la hora actual
   */
  private calculateIsOpenFromHours(openingHours: any, currentTime: Date = new Date()): boolean {
    if (!openingHours || typeof openingHours !== 'object') {
      return false;
    }

    const currentDay = currentTime.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

    // Mapear día de la semana a clave de openingHours
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    const todayKey = dayMap[currentDay];
    const todayHours = openingHours[todayKey];

    // Si el día no está configurado o está cerrado, retornar false
    if (!todayHours || !todayHours.open) {
      return false;
    }

    // Si no tiene horarios de apertura/cierre, asumir que está abierto si open = true
    if (!todayHours.openTime || !todayHours.closeTime) {
      return todayHours.open;
    }

    // Convertir hora actual a minutos desde medianoche
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    // Convertir horarios de apertura y cierre a minutos
    const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Verificar si la hora actual está dentro del rango
    if (openMinutes <= closeMinutes) {
      // Horario normal (ej: 09:00 - 22:00)
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } else {
      // Horario que cruza medianoche (ej: 22:00 - 02:00)
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
  }
}
