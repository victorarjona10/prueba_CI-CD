import { getIO } from "../socket";
import { IOrder } from "../models/order";
import { UserService } from "./user.service";
import { CompanyService } from "./company.service";
import { NotificationModel, INotification } from "../models/notification";
import mongoose from "mongoose";

export class NotificationService {
  private userService = new UserService();
  private companyService = new CompanyService();

  // Mapa para rastrear conexiones de socket por userId
  private userSockets = new Map<string, string[]>();
  // Variable para controlar si ya se configuraron los listeners
  private listenersInitialized = false;
  constructor() {}
  public initializeListeners() {
    if (!this.listenersInitialized) {
      this.setupSocketListeners();
      this.listenersInitialized = true;
    }
  }
  private setupSocketListeners() {
    try {
      const io = getIO();
      io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Cuando un usuario se identifica
        socket.on("authenticate", async (userId: string) => {
          console.log(`User ${userId} authenticated on socket ${socket.id}`);

          // Almacenamos la conexión de socket para este usuario
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, []);
          }
          this.userSockets.get(userId)?.push(socket.id);

          // Informamos al cliente que la autenticación fue exitosa
          socket.emit("authenticated", { success: true });

          // Enviamos notificaciones pendientes (no leídas) al usuario
          await this.sendPendingNotifications(userId, socket.id);
        });

        // Cuando un usuario se desconecta
        socket.on("disconnect", () => {
          console.log(`Client disconnected: ${socket.id}`);

          // Eliminamos este socket de userSockets
          this.userSockets.forEach((socketIds, userId) => {
            const updatedSocketIds = socketIds.filter((id) => id !== socket.id);
            if (updatedSocketIds.length === 0) {
              this.userSockets.delete(userId);
            } else {
              this.userSockets.set(userId, updatedSocketIds);
            }
          });
        });
      });
      console.log("Socket listeners initialized successfully");
    } catch (error) {
      console.error("Failed to initialize socket listeners:", error);
    }
  }

  // Método para enviar notificaciones pendientes al usuario cuando se conecta
  private async sendPendingNotifications(userId: string, socketId: string) {
    try {
      // Buscar notificaciones no leídas del usuario
      const notifications = await NotificationModel.find({
        recipient_id: new mongoose.Types.ObjectId(userId),
        read: false,
      })
        .sort({ created_at: -1 })
        .limit(10);

      if (notifications.length > 0) {
        console.log(
          `Sending ${notifications.length} pending notifications to user ${userId}`
        );

        // Enviar cada notificación al socket del usuario
        for (const notification of notifications) {
          const io = getIO();
          io.to(socketId).emit("notification", {
            id: notification._id.toString(),
            type: notification.type,
            message: notification.message,
            created_at: notification.created_at,
            read: notification.read,
          });
        }
      }
    } catch (error) {
      console.error("Error sending pending notifications:", error);
    }
  }

  // Método para enviar notificación de nuevo pedido
  async sendNewOrderNotification(order: IOrder) {
    try {
      // Obtenemos la empresa
      const company = await this.companyService.getCompanyById(
        order.company_id.toString()
      );
      if (!company) {
        console.error("Company not found for notification");
        return;
      }

      // Obtenemos el usuario que realizó el pedido
      const user = await this.userService.getUserById(order.user_id.toString());
      if (!user) {
        console.error("User not found for notification");
        return;
      }

      // Obtenemos el propietario de la empresa
      const ownerId = company.ownerId.toString();

      // Preparamos los datos de la notificación
      const notificationData = {
        type: "new_order",
        order: {
          id: order._id.toString(),
          status: order.status,
          date: order.orderDate,
        },
        company: {
          id: company._id.toString(),
          name: company.name,
        },
        user: {
          id: user._id.toString(),
          name: user.name,
        },
        message: `Nuevo pedido de ${user.name} para ${company.name}`,
      };

      // Crear la notificación en la base de datos
      const notification = new NotificationModel({
        recipient_id: new mongoose.Types.ObjectId(ownerId),
        sender_id: new mongoose.Types.ObjectId(order.user_id.toString()),
        related_id: new mongoose.Types.ObjectId(order._id.toString()),
        type: "new_order",
        message: `Nuevo pedido de ${user.name} para ${company.name}`,
        data: notificationData,
        read: false,
      });

      // Guardar en base de datos
      await notification.save();
      console.log(
        `Notification saved to database with ID: ${notification._id}`
      );

      // Enviamos la notificación si el propietario está conectado
      if (this.userSockets.has(ownerId)) {
        const socketIds = this.userSockets.get(ownerId) || [];
        for (const socketId of socketIds) {
          const io = getIO();
          io.to(socketId).emit("notification", {
            id: notification._id.toString(),
            ...notificationData,
            created_at: notification.created_at,
            read: false,
          });
          console.log(
            `Notification sent to socket ${socketId} for user ${ownerId}`
          );
        }
      } else {
        console.log(
          `Owner ${ownerId} not connected, notification stored for later delivery`
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  // Método para marcar una notificación como leída
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await NotificationModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(notificationId),
          recipient_id: new mongoose.Types.ObjectId(userId),
        },
        { read: true }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  // Método para obtener notificaciones de un usuario
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    onlyUnread: boolean = false
  ) {
    try {
      const query: any = { recipient_id: new mongoose.Types.ObjectId(userId) };

      if (onlyUnread) {
        query.read = false;
      }

      const notifications = await NotificationModel.find(query)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return [];
    }
  }

  // Método para eliminar notificaciones antiguas (puede ejecutarse periódicamente)
  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await NotificationModel.deleteMany({
        created_at: { $lt: cutoffDate },
      });

      console.log(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error deleting old notifications:", error);
      return 0;
    }
  }
}

// Exportamos una instancia para uso global
export const notificationService = new NotificationService();
