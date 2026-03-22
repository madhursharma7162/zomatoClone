import type { IOrder } from "../types";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import axios from "axios";
import { riderService } from "../main";
import { useRef } from "react";

declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options?: any): any;
  }
}

const riderIcon = new L.DivIcon({
  html: "🛵",
  iconSize: [30, 30],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: "📦",
  iconSize: [30, 30],
  className: "",
});

interface Props {
  order: IOrder;
}

const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();
  const routingRef = useRef<any>(null);

  // ✅ CREATE ONLY ONCE
  useEffect(() => {
    if (!map) return;

    const control = L.Routing.control({
      waypoints: [],
      lineOptions: {
        styles: [{ color: "#E23744", weight: 5 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      // routeWhileDragging: false,
      // fitSelectedRoutes: true,
      // showAlternatives: false,

      createMarker: () => null,
       // 👇 THIS FIXES THE TEXT ISSUE
      //itineraryFormatter: () => null,

      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    routingRef.current = control;

    return () => {
      // ✅ ONLY runs on unmount now
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch (err) {
          console.log("⚠️ Cleanup ignored");
        }
      }
    };
  }, [map]);

  // ✅ UPDATE WAYPOINTS (NO RE-CREATION)
  useEffect(() => {
    if (!routingRef.current || !from || !to) return;

    routingRef.current.setWaypoints([
      L.latLng(from),
      L.latLng(to),
    ]);
  }, [from, to]);

  return null;
};

const RiderOrderMap = ({ order }: Props) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null
  );

  // ✅ ADD THIS LINE HERE
  const lastLocationRef = useRef<[number, number] | null>(null);

  if (
    order.deliveryAddress.latitude == null ||
    order.deliveryAddress.longitude == null
  ) {
    return null;
  }

  const deliveryLocation: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  useEffect(() => {
    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          const newLocation: [number, number] = [latitude, longitude];

          // ✅ Skip if rider hasn't moved significantly
          if (
            lastLocationRef.current &&
            Math.abs(lastLocationRef.current[0] - latitude) < 0.0001 &&
            Math.abs(lastLocationRef.current[1] - longitude) < 0.0001
          ) {
            return;
          }

          // ✅ Update ref + state
          lastLocationRef.current = newLocation;
          setRiderLocation(newLocation);

          // ✅ API call
          await axios.post(
            `${riderService}api/rider/location-update`,
            {
              orderId: order._id,
              orderUserId: order.userId,
              latitude,
              longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        },
        (err) => console.log("Location Error:", err),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  }, [order._id, order.userId]);

  if (!riderLocation) return null;
  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <MapContainer
        center={riderLocation}
        zoom={14}
        className="h-87.5 w-full rounded-lg"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>You (Rider)</Popup>
        </Marker>
        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>
        <Routing from={riderLocation} to={deliveryLocation} />
      </MapContainer>
    </div>
  );
};

export default RiderOrderMap;
