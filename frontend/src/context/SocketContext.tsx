import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppContext";
import { realtimeService } from "../main";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth } = useAppData();

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuth) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    if (socketRef.current) return;

    const socket = io(realtimeService, {
      auth: {
        token: localStorage.getItem("token"),
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket Connected", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("Socket Error:", err.message);
    });

    // ============================================================
    // ✅ EXISTING: HANDLE RESTAURANT STATUS UPDATES
    // ============================================================
    socket.on("restaurant:status_update", (data) => {
      console.log("📢 Real-time Status Update Received:", data);

      window.dispatchEvent(new Event("refresh-restaurant-list"));
    });

    // ============================================================
    // ✅ NEW: HANDLE NEW ORDER FOR RIDER  🔥🔥🔥
    // ============================================================
    socket.on("order:available", (data) => {
      console.log("🚀 New Order Received:", data);

      // Broadcast event to entire app
      window.dispatchEvent(
        new CustomEvent("new-order-available", { detail: data })
      );
    });

    // ============================================================
    // ✅ OPTIONAL DEBUG (REMOVE LATER)
    // ============================================================
    socket.onAny((event, data) => {
      console.log("📡 EVENT:", event, data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuth]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);