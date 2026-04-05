"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// Invoices managed by FINANCE and ADMIN
const financeManager = (0, auth_middleware_1.hasRole)('ADMIN', 'FINANCE');
router.get('/', invoice_controller_1.getInvoices);
router.post('/', financeManager, invoice_controller_1.createInvoice);
router.patch('/:id', financeManager, invoice_controller_1.updateInvoice);
router.delete('/:id', financeManager, invoice_controller_1.deleteInvoice);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map