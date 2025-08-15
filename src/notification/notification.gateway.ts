import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from './notification.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userEmail = payload.email;
      
      this.connectedUsers.set(payload.sub, client.id);
      
      this.logger.log(`User ${payload.email} connected with socket ${client.id}`);
      
      // Join user to their personal room
      client.join(`user_${payload.sub}`);
      
      // Send unread notifications count on connection
      const unreadCount = await this.notificationService.getUnreadCount(payload.sub);
      client.emit('unread_count', { count: unreadCount });
      
    } catch (error) {
      this.logger.error('Failed to authenticate socket connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userEmail} disconnected`);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(data.room);
    this.logger.log(`User ${client.userEmail} joined room ${data.room}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(data.room);
    this.logger.log(`User ${client.userEmail} left room ${data.room}`);
  }

  @SubscribeMessage('mark_notification_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await this.notificationService.markAsRead(data.notificationId, client.userId);
      const unreadCount = await this.notificationService.getUnreadCount(client.userId);
      client.emit('unread_count', { count: unreadCount });
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
    }
  }

  // Métodos para enviar notificaciones desde otros servicios
  
  /**
   * Envía una notificación a un usuario específico
   */
  async sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(`user_${userId}`).emit('new_notification', notification);
      
      // También actualizar el contador de no leídas
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.server.to(`user_${userId}`).emit('unread_count', { count: unreadCount });
    }
  }

  /**
   * Envía una notificación a múltiples usuarios
   */
  async sendNotificationToUsers(userIds: number[], notification: any) {
    for (const userId of userIds) {
      await this.sendNotificationToUser(userId, notification);
    }
  }

  /**
   * Envía una notificación de difusión a todos los usuarios conectados
   */
  sendBroadcastNotification(notification: any) {
    this.server.emit('broadcast_notification', notification);
  }

  /**
   * Envía una notificación a una sala específica
   */
  sendNotificationToRoom(room: string, notification: any) {
    this.server.to(room).emit('room_notification', notification);
  }

  /**
   * Notifica sobre cambios en el stock
   */
  async notifyStockChange(productId: number, stockData: any) {
    this.server.emit('stock_update', {
      productId,
      ...stockData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifica sobre nuevas citas
   */
  async notifyNewAppointment(appointmentData: any, userIds: number[] = []) {
    const notification = {
      type: 'new_appointment',
      data: appointmentData,
      timestamp: new Date().toISOString(),
    };

    if (userIds.length > 0) {
      await this.sendNotificationToUsers(userIds, notification);
    } else {
      this.sendBroadcastNotification(notification);
    }
  }

  /**
   * Notifica sobre cambios en el estado de suscripción
   */
  async notifySubscriptionChange(userId: number, subscriptionData: any) {
    await this.sendNotificationToUser(userId, {
      type: 'subscription_update',
      data: subscriptionData,
      timestamp: new Date().toISOString(),
    });
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // También intentar obtener el token desde query params
    const token = client.handshake.query.token;
    if (token && typeof token === 'string') {
      return token;
    }
    
    return null;
  }

  /**
   * Obtiene estadísticas de conexiones
   */
  getConnectionStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      authenticatedUsers: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.entries()).map(([userId, socketId]) => ({
        userId,
        socketId,
      })),
    };
  }
}