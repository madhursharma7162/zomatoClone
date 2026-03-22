import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SEC!) as any;

      if (!decoded || !decoded.user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = decoded.user;

      next();
    } catch (error) {
      console.log("❌ Socket auth failed: ", error);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    const userId = user._id;
    socket.join(`user:${userId}`);

    // ✅ ADD THIS LINE: Every user joins the global broadcast room
    socket.join("global"); 
    console.log(`User ${userId} joined global room`);

    if (user.restaurantId) {
      socket.join(`restaurant:${user.restaurantId}`);
      // ✅ ADD THIS LOG TO VERIFY
      console.log(`✅ Success: Joined restaurant room: restaurant:${user.restaurantId}`);
    } else {
      // ✅ ADD THIS LOG TO SEE IF IT'S MISSING
      console.log(`⚠️ Warning: No restaurantId found in token for user ${userId}`);
    }

    console.log(`User connected: ${userId}`);
    console.log("Active Socket rooms: ", [...socket.rooms]);

    socket.on("disconnect", () => {
      console.log(`User disconnected:${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};
