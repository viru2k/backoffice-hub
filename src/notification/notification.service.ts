import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(title: string, message: string, userId: number) {
    const notification = this.notificationRepo.create({
      title,
      message,
      user: { id: userId },
    });
    return this.notificationRepo.save(notification);
  }

  async getAll(userId: number) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number) {
    const noti = await this.notificationRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!noti) throw new NotFoundException('Notificación no encontrada');

    noti.read = true;
    return this.notificationRepo.save(noti);
  }

  async getUnread(userId: number) {
    return this.notificationRepo.find({
      where: { user: { id: userId }, read: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getSummary(userId: number) {
    const [all, unread] = await Promise.all([
      this.notificationRepo.count({ where: { user: { id: userId } } }),
      this.notificationRepo.count({ where: { user: { id: userId }, read: false } }),
    ]);
  
    const latest = await this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  
    return { total: all, unread, latest };
  }
  
}
