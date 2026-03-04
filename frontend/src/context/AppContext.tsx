import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, restaurantService } from "../main";
import type { AppContextType, LocationData, User } from "../types";
import { Toaster } from "react-hot-toast";

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

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // Don't attempt fetch if no token exists

      const { data } = await axios.get(`${authService}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // CRITICAL: This allows CORS cookies/headers
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log("Fetch User Error:", error);
      setIsAuth(false); // Reset state on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation)
      return alert("Please Allow Location to continue");
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // ✅ Use restaurant backend proxy instead of calling OpenStreetMap directly
          const { data } = await axios.get(
            `${restaurantService}/api/geocode/reverse?lat=${latitude}&lon=${longitude}`,
          );

          setLocation({
            latitude,
            longitude,
            formattedAddress: data.display_name || "current location",
          });

          setCity(
            data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.suburb ||
              "Your Location",
          );

          setLoadingLocation(false);
        } catch (error) {
          console.warn("Could not fetch location via backend proxy:", error);
          setLocation({
            latitude,
            longitude,
            formattedAddress: "Current Location",
          });
          setCity("Failed To Load");
          setLoadingLocation(false);
        }
        {
          /*...........*/
        }
      },
      (err) => console.log("Geolocation Error:", err.message),
    ); // ADD ERROR CALLBACK HERE
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
      }}
    >
      {children} <Toaster />
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
