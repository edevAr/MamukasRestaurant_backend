import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto): Promise<Announcement> {
    const announcement = this.announcementsRepository.create(createAnnouncementDto);
    return this.announcementsRepository.save(announcement);
  }

  async findAll(activeOnly: boolean = false): Promise<Announcement[]> {
    const query = this.announcementsRepository.createQueryBuilder('announcement');

    if (activeOnly) {
      const now = new Date();
      query
        .where('announcement.isActive = :isActive', { isActive: true })
        .andWhere('(announcement.startDate IS NULL OR announcement.startDate <= :now)', { now })
        .andWhere('(announcement.endDate IS NULL OR announcement.endDate >= :now)', { now });
    }

    return query.orderBy('announcement.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }
    return announcement;
  }

  async update(id: string, updateData: Partial<CreateAnnouncementDto>): Promise<Announcement> {
    const announcement = await this.findOne(id);
    Object.assign(announcement, updateData);
    return this.announcementsRepository.save(announcement);
  }

  async remove(id: string): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementsRepository.remove(announcement);
  }

  async toggleActive(id: string): Promise<Announcement> {
    const announcement = await this.findOne(id);
    announcement.isActive = !announcement.isActive;
    return this.announcementsRepository.save(announcement);
  }
}
