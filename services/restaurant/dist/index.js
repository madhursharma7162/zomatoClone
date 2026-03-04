"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_js_1 = __importDefault(require("./config/db.js"));
const dotenv_1 = __importDefault(require("dotenv"));
const restaurant_js_1 = __importDefault(require("./routes/restaurant.js"));
const menuitems_js_1 = __importDefault(require("./routes/menuitems.js"));
const cors_1 = __importDefault(require("cors"));
const geocode_js_1 = __importDefault(require("./routes/geocode.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options(/.*/, (0, cors_1.default)());
app.use(express_1.default.json());
const PORT = Number(process.env.PORT) || 5001;
app.use("/api/restaurant", restaurant_js_1.default);
app.use("/api/item", menuitems_js_1.default);
app.use("/api/geocode", geocode_js_1.default);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Restaurant service is running on port ${PORT}`);
    (0, db_js_1.default)();
});
