import { useRef } from "react";
import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, restaurantService } from "../main";
import type { AppContextType, LocationData, User, ICart } from "../types";
import { Toaster, toast } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Fetching Location");

  const hasFetchedLocation = useRef(false);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get(`${authService}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log("Fetch User Error:", error);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);

  async function fetchCart() {
    if (!user || user.role !== "customer") return;

    try {
      const { data } = await axios.get(`${restaurantService}api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subTotal || data.subtotal || 0);
      setQuantity(data.cartLength);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      fetchCart();
    }
  }, [user]);

  // 🌍 LOCATION LOGIC (OPTIMIZED + CACHED + EXPIRY)
  useEffect(() => {
    // ✅ STEP 1: Check cache first
    const cachedLocation = localStorage.getItem("user_location");

    if (cachedLocation) {
      const parsed = JSON.parse(cachedLocation);

      // ✅ STEP 2: Check expiry (30 min)
      if (Date.now() - parsed.timestamp < 1000 * 60 * 30) {
        setLocation(parsed.location);
        setCity(parsed.city);
        hasFetchedLocation.current = true;
        return;
      }
    }

    // Prevent duplicate calls
    if (location || loadingLocation || hasFetchedLocation.current) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    hasFetchedLocation.current = true;
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const { data } = await axios.get(
            `${restaurantService}api/geocode/reverse?lat=${latitude}&lon=${longitude}`
          );

          const addr = data.address || {};
          const detectedCity =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            "Your Location";

          const locationData = {
            latitude,
            longitude,
            formattedAddress: data.display_name || "Current Location",
          };

          setLocation(locationData);
          setCity(detectedCity);

          // ✅ STEP 3: Save to cache
          localStorage.setItem(
            "user_location",
            JSON.stringify({
              location: locationData,
              city: detectedCity,
              timestamp: Date.now(),
            })
          );
        } catch (error: any) {
          console.warn("Geocode proxy error:", error);

          if (error.response?.status === 429) {
            toast.error("Location service busy. Please wait a moment.");
          }

          setCity("Location Error");
          setLocation({
            latitude,
            longitude,
            formattedAddress: "Manual Location Needed",
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      (err) => {
        console.error("Geolocation Permission Error:", err.message);
        setCity("Permission Denied");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60000, // ✅ reuse last GPS for 1 min
        timeout: 10000,
      }
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuth,
        loading,
        setIsAuth,
        setLoading,
        setUser,
        user,
        location,
        loadingLocation,
        city,
        cart,
        fetchCart,
        quantity,
        subTotal,
      }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};