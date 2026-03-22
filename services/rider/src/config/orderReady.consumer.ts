import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import { Rider } from "../model/Rider.js";

export const startOrderReadyConsumer = async () => {
  const channel = getChannel();

  console.log("Starting to consume from:", process.env.ORDER_READY_QUEUE);

  // ✅ Normalize URL once
  const BASE_URL = process.env.REALTIME_SERVICE?.replace(/\/$/, "");

  channel.consume(process.env.ORDER_READY_QUEUE!, async (msg) => {
    if (!msg) return;

    try {
      console.log("📩 Received Message:", msg.content.toString());

      const event = JSON.parse(msg.content.toString());

      console.log("📌 Event type:", event.type);

      if (event.type !== "ORDER_READY_FOR_RIDER") {
        console.log("⏭️ Skipping non ORDER_READY_FOR_RIDER event");
        channel.ack(msg);
        return;
      }

      const { orderId, restaurantId, location } = event.data;

      console.log("📍 Searching for riders near:", location);

      const riders = await Rider.find({
        isAvailable: true,
        isVerified: true,
        location: {
          $near: {
            $geometry: location,
            $maxDistance: 500,
          },
        },
      });


      console.log(
        "👥 Riders found:",
        riders.map((r) => ({
          userId: r.userId,
          location: r.location,
        }))
      );

      console.log(`👥 Found ${riders.length} nearby riders`);

      if (riders.length === 0) {
        console.log("❌ No riders available nearby");
        channel.ack(msg);
        return;
      }

      // ✅ Emit to each rider
      for (const rider of riders) {
        console.log(`🚴 Notifying rider userId: ${rider.userId}`);

        try {
          console.log("📡 Calling:", `${BASE_URL}/api/v1/internal/emit`);

          await axios.post(
            `${BASE_URL}/api/v1/internal/emit`,
            {
              event: "order:available",
              room: `user:${rider.userId}`,
              payload: { orderId, restaurantId },
            },
            {
              headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
              },
            }
          );

          console.log(`✅ Notified rider ${rider.userId} successfully`);
        } catch (error: any) {
          console.log(`❌ Failed to notify rider ${rider.userId}`);
          console.log(
            "⚠️ ERROR DETAILS:",
            error.response?.data || error.message
          );
        }
      }

      channel.ack(msg);
      console.log("✅ Message acknowledged");
    } catch (error) {
      console.log("❌ OrderReady consumer error:", error);
    }
  });
};