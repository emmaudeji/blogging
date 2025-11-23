"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_LIMIT = exports.DEFAULT_LIMIT = void 0;
exports.normalizeLimit = normalizeLimit;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 100;
function normalizeLimit(limit) {
    if (!limit || limit < 1)
        return exports.DEFAULT_LIMIT;
    return Math.min(limit, exports.MAX_LIMIT);
}
