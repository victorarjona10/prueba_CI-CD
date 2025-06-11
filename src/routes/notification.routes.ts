import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
  getNotifications,
  markNotificationAsRead,
  clearAllNotifications,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", checkJwt, getNotifications);
router.put("/:id/read", checkJwt, markNotificationAsRead);
router.post("/clear", checkJwt, clearAllNotifications);

export default router;
