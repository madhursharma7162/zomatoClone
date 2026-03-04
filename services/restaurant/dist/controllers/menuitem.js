"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleMenuItemAvailability = exports.deleteMenuItem = exports.getAllItems = exports.addMenuItem = void 0;
const trycatch_js_1 = __importDefault(require("../middlewares/trycatch.js"));
const datauri_js_1 = __importDefault(require("../config/datauri.js"));
const Restaurant_js_1 = __importDefault(require("../models/Restaurant.js"));
const axios_1 = __importDefault(require("axios"));
const MenuItems_js_1 = __importDefault(require("../models/MenuItems.js"));
exports.addMenuItem = (0, trycatch_js_1.default)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Please Login",
        });
    }
    const restaurant = await Restaurant_js_1.default.findOne({ ownerId: req.user._id });
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
    const fileBuffer = (0, datauri_js_1.default)(file);
    if (!fileBuffer?.content) {
        return res.status(500).json({
            message: "Failed to create file buffer",
        });
    }
    //================================================================
    let finalUploadResult; // 1. Declare it here (outside)
    try {
        // 2. Remove "const { data: uploadResult }" and just assign it
        const { data } = await axios_1.default.post(`${process.env.UTILS_SERVICE}/api/upload`, { buffer: fileBuffer.content });
        finalUploadResult = data;
        console.log("Upload Success:", finalUploadResult.url);
    }
    catch (error) {
        console.error("Utils Service Error:", error.message);
        return res.status(500).json({
            message: "Image upload service unreachable",
            error: error.message,
        });
    }
    const item = await MenuItems_js_1.default.create({
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
exports.getAllItems = (0, trycatch_js_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message: "Id is required",
        });
    }
    const items = await MenuItems_js_1.default.find({ restaurantId: id });
    res.json(items);
});
exports.deleteMenuItem = (0, trycatch_js_1.default)(async (req, res) => {
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
    const item = await MenuItems_js_1.default.findById(itemId);
    if (!item) {
        return res.status(404).json({
            message: "No Item Found",
        });
    }
    const restaurant = await Restaurant_js_1.default.findOne({
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
});
exports.toggleMenuItemAvailability = (0, trycatch_js_1.default)(async (req, res) => {
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
    const item = await MenuItems_js_1.default.findById(itemId);
    if (!item) {
        return res.status(404).json({
            message: "No Item Found",
        });
    }
    const restaurant = await Restaurant_js_1.default.findOne({
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
        message: `Item marked as ${item.isAvailable ? "available" : "unavailable"}`,
        item,
    });
});
