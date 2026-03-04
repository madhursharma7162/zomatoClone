import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import getBuffer from "../config/datauri.js";
import Restaurant from "../models/Restaurant.js";
import axios from "axios";
import MenuItems from "../models/MenuItems.js";


export const addMenuItem = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

  if (!restaurant) {
    return res.status(404).json({
      message: "NO Restaurant found",
    });
  }

  const { name, description, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      message: "Name and price are required",
    });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "Please give image",
    });
  }

  const fileBuffer = getBuffer(file);

  if (!fileBuffer?.content) {
    return res.status(500).json({
      message: "Failed to create file buffer",
    });
  }

  //================================================================

  let finalUploadResult; // 1. Declare it here (outside)

  try {
    // 2. Remove "const { data: uploadResult }" and just assign it
    const { data } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      { buffer: fileBuffer.content },
    );
    finalUploadResult = data;
    console.log("Upload Success:", finalUploadResult.url);
  } catch (error: any) {
    console.error("Utils Service Error:", error.message);
    return res.status(500).json({
      message: "Image upload service unreachable",
      error: error.message,
    });
  }

  const item = await MenuItems.create({
    name,
    description,
    price,
    restaurantId: restaurant._id,
    image: finalUploadResult.url,
  });

  res.json({
    message: "Item Added Successfully",
    item,
  });
});

export const getAllItems = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      message: "Id is required",
    });
  }

  const items = await MenuItems.find({ restaurantId: id });
  res.json(items);
});

export const deleteMenuItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const { itemId } = req.params;
    if (!itemId) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const item = await MenuItems.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "No Item Found",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: item.restaurantId,
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "NO Restaurant found",
      });
    }

    await item.deleteOne();

    res.json({
      message: "Menu item deleted successfully",
    });
  },
);

export const toggleMenuItemAvailability = TryCatch(
  async (req: AuthenticatedRequest, res) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const { itemId } = req.params;
    if (!itemId) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const item = await MenuItems.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "No Item Found",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: item.restaurantId,
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "NO Restaurant found",
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
        message: `Item marked as ${
            item.isAvailable ? "available" : "unavailable"
        }`,
        item,
    });


  },
);
