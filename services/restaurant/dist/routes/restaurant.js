"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuth_js_1 = require("../middlewares/isAuth.js");
const restaurant_js_1 = require("../controllers/restaurant.js");
const multer_js_1 = __importDefault(require("../middlewares/multer.js"));
const router = express_1.default.Router();
router.post("/new", isAuth_js_1.isAuth, isAuth_js_1.isSeller, multer_js_1.default, restaurant_js_1.addRestaurant);
router.get("/my", isAuth_js_1.isAuth, isAuth_js_1.isSeller, restaurant_js_1.fetchMyRestaurant);
router.put("/status", isAuth_js_1.isAuth, isAuth_js_1.isSeller, restaurant_js_1.updateStatusRestaurant);
router.put("/edit", isAuth_js_1.isAuth, isAuth_js_1.isSeller, restaurant_js_1.updateRestaurant);
exports.default = router;
