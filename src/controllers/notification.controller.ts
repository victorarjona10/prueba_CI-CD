import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import mongoose from "mongoose";

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Unauthorized
 */
export async function getNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // @ts-ignore - Asumimos que el middleware de autenticación añade user al objeto req
    const userId = req.user.id;

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const onlyUnread = req.query.unread === "true";

    const notifications = await notificationService.getUserNotifications(
      userId,
      limit,
      offset,
      onlyUnread
    );

    res.status(200).json(notifications);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error getting notifications", error: error.message });
  }
}

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
export async function markNotificationAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const notificationId = req.params.id;
    // @ts-ignore - Asumimos que el middleware de autenticación añade user al objeto req
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: "Invalid notification ID" });
      return;
    }

    const success = await notificationService.markAsRead(
      notificationId,
      userId
    );

    if (success) {
      res.status(200).json({ message: "Notification marked as read" });
    } else {
      res
        .status(404)
        .json({ message: "Notification not found or not owned by user" });
    }
  } catch (error: any) {
    res.status(500).json({
      message: "Error marking notification as read",
      error: error.message,
    });
  }
}

/**
 * @swagger
 * /api/notifications/clear:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
export async function clearAllNotifications(
  req: Request,
  res: Response
): Promise<void> {
  // Este método podría implementarse en el servicio de notificaciones
  res.status(501).json({ message: "Not implemented yet" });
}
