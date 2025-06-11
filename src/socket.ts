import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { Server } from "http";

// Variable para almacenar la instancia de Socket.IO
let io: SocketIOServer;

/**
 * Inicializa Socket.IO en el servidor HTTP
 */
export function initializeSocketIO(server: Server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:4200", "http://localhost:3000"],
      credentials: true,
    },
  });

  console.log("Socket.IO inicializado");
  return io;
}

/**
 * Devuelve la instancia de Socket.IO
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error(
      "Socket.IO no ha sido inicializado. Llama a initializeSocketIO primero."
    );
  }
  return io;
}
