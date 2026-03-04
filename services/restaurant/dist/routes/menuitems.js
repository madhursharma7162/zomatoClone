"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuth_js_1 = require("../middlewares/isAuth.js");
const menuitem_js_1 = require("../controllers/menuitem.js");
const multer_js_1 = __importDefault(require("../middlewares/multer.js"));
const router = express_1.default.Router();
router.post("/new", isAuth_js_1.isAuth, isAuth_js_1.isSeller, multer_js_1.default, menuitem_js_1.addMenuItem);
router.get("/all/:id", isAuth_js_1.isAuth, menuitem_js_1.getAllItems);
router.delete("/:id", isAuth_js_1.isAuth, isAuth_js_1.isSeller, menuitem_js_1.deleteMenuItem);
router.delete("/status/:id", isAuth_js_1.isAuth, isAuth_js_1.isSeller, menuitem_js_1.toggleMenuItemAvailability);
exports.default = router;
