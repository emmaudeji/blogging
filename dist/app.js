"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const sessionStore_1 = require("./config/sessionStore");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const routes_1 = __importDefault(require("./routes"));
exports.app = (0, express_1.default)();
// Trust proxy (needed for HTTPS on platforms like Render/Fly)
exports.app.set("trust proxy", 1);
// Security middlewares
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({ origin: true, credentials: true }));
exports.app.use((0, cookie_parser_1.default)());
// Body parsing
exports.app.use(express_1.default.json({ limit: "10kb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Logging
if (env_1.env.NODE_ENV === "development")
    exports.app.use((0, morgan_1.default)("dev"));
// Sessions
exports.app.use((0, express_session_1.default)(sessionStore_1.sessionOptions));
// Rate limiting on auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many login attempts, try again later",
});
exports.app.use("/api/auth", authLimiter);
// ---------------------------
// ⭐ ROOT BASE ROUTE - serve DOCUMENT.md
// ---------------------------
exports.app.get("/", (req, res) => {
    const docPath = path_1.default.resolve(process.cwd(), "DOCUMENT.md");
    res.sendFile(docPath, {}, (err) => {
        if (err) {
            return res.status(500).send("DOCUMENT.md not found");
        }
    });
});
// Mount API routes
exports.app.use("/api", routes_1.default);
// Handle JSON parse errors from body-parser explicitly
exports.app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON in request body" });
    }
    next(err);
});
// Global error handler (must be last)
exports.app.use(errorHandler_1.errorHandler);
