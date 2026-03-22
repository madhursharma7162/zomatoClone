import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { Rider } from "../model/Rider.js";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
// controllers/rider.ts
import cloudinary from "../config/cloudinary.js";

export const addRiderProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.role !== "rider") return res.status(403).json({ message: "Only riders can create rider profile" });

  const file = req.file;
  if (!file) return res.status(400).json({ message: "Rider Image is required" });

  // ✅ Upload to Cloudinary
  let uploadResult;
  try {
    uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "rider_profiles",
          upload_preset: "rider_profiles_unsigned",
          unsigned: true,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error("Unknown upload error"));
        }
      );
      stream.end(file.buffer);
    });
  } catch (err: any) {
    console.error("❌ Cloudinary upload failed:", err);
    return res.status(500).json({ message: "Cloudinary upload failed", error: err.message || err });
  }

  const { phoneNumber, aadharNumber, drivingLicenseNumber, latitude, longitude } = req.body;

  if (!phoneNumber || !aadharNumber || !drivingLicenseNumber || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // ✅ FIX: Convert to numbers
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ message: "Invalid coordinates" });
  }

  const existingProfile = await Rider.findOne({ userId: user._id });
  if (existingProfile) return res.status(400).json({ message: "Rider profile already exists" });

  const riderProfile = await Rider.create({
    userId: user._id,
    picture: uploadResult.secure_url,
    phoneNumber,
    aadharNumber,
    drivingLicenseNumber,
    location: {
      type: "Point",
      coordinates: [lng, lat], // ✅ FIXED
    },
    isAvailable: false,
    isVerified: false,
  });

  res.status(201).json({
    message: "Rider profile created successfully",
    riderProfile,
  });
});

export const fetchMyProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const account = await Rider.findOne({ userId: user._id });

    res.json(account);
  }
);

export const toggleRiderAvailablity = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role !== "rider") {
      return res.status(403).json({
        message: "Only riders can create rider profile",
      });
    }

    const { isAvailable, latitude, longitude } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        message: "isAvailable must be boolean",
      });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        message: "location is required",
      });
    }

    const rider = await Rider.findOne({
      userId: user._id,
      isVerified:true,
    });

    if (!rider) {
      return res.status(404).json({
        message: "Rider profile not found",
      });
    }

    if (isAvailable && !rider.isVerified) {
      return res.status(403).json({
        message: "Rider is not verified",
      });
    }

        if (!isAvailable) {
      try {
        const { data } = await axios.get(
          `${process.env.RESTAURANT_SERVICE}api/order/current/rider?riderId=${rider._id}`,
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );

        // 👉 If order exists → block offline
        if (data && data._id) {
          return res.status(400).json({
            message: "Cannot go offline while delivering an order",
          });
        }
      } catch (error) {
        // If service fails, allow fallback (optional)
        console.log("⚠️ Order check failed, allowing toggle");
      }
    }

    rider.isAvailable = isAvailable;

    rider.location = {
      type: "Point",
      coordinates: [lng, lat],
    };
    rider.lastActiveAt = new Date();

    await rider.save();

    res.json({
      message: isAvailable ? "Rider is now online" : "Rider is now offline",
      rider,
    });
  }
);

export const acceptOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const riderUserId = req.user?._id;
  const { orderId } = req.params;

  if (!riderUserId) {
    return res.status(400).json({
      message: "Please Login",
    });
  }

  const rider = await Rider.findOne({ userId: riderUserId, isAvailable: true });

  if (!rider) {
    return res.status(404).json({ message: "rider not found" });
  }

  try {
    const { data } = await axios.put(
      `${process.env.RESTAURANT_SERVICE}api/order/assign/rider`,
      {
        orderId,
        riderId: rider._id.toString(),
        riderUserId: rider.userId,
        riderName: rider.picture,
        riderPhone: rider.phoneNumber,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    if (data.success) {
      const riderDetails = await Rider.findOneAndUpdate(
        {
          userId: riderUserId,
          isAvailable: true,
        },
        { isAvailable: false },
        { new: true }
      );

      res.json({ message: "Order accepted" });
    }
  } catch (error) {
    res.status(400).json({
      message: "Order already taken",
    });
  }
});

export const fetchMyCurrentOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;

    if (!riderUserId) {
      return res.status(400).json({
        message: "Please Login",
      });
    }

    // services/rider/controllers/rider.ts -> fetchMyCurrentOrder
    const rider = await Rider.findOne({ userId: riderUserId });

    if (!rider) {
      // ✅ Change 404 to 200
      return res.status(200).json({
        message: "Rider profile not found",
        order: null
      });
    }

    if (!rider.isVerified) {
      return res.status(200).json({
        order: null,
      });
    }

    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE}api/order/current/rider?riderId=${rider._id}`,
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      res.json({
        order: data,
      });
    } catch (error: any) {
      return res.status(200).json({
        order: null,
      });
    }
  }
);

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const rider = await Rider.findOne({ userId: userId });

    if (!rider) {
      return res.status(404).json({
        message: "Please Login",
      });
    }

    const { orderId } = req.params;

    try {
      const { data } = await axios.put(
        `${process.env.RESTAURANT_SERVICE}api/order/update/status/rider`,
        { orderId },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      res.json({
        message: data.message,
      });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({
        message: error.response.data.message,
      });
    }
  }
);


export const updateRiderLocationLive = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { latitude, longitude, orderId } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // ✅ Update rider location in DB
    await Rider.findOneAndUpdate(
      { userId: user._id },
      {
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        lastActiveAt: new Date(),
      }
    );

    // ✅ Emit to customer via realtime
    await axios.post(
      `${process.env.REALTIME_SERVICE}api/v1/internal/emit`,
      {
        event: "rider:location",
        room: `user:${req.body.orderUserId || ""}`, // optional improvement later
        payload: { latitude: lat, longitude: lng },
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    res.json({ success: true });
  }
);
