import { Router } from 'express';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../controllers/invoice.controller';
import { protect, hasRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

// Invoices managed by ACCOUNT_MANAGER and ADMIN
const billingManager = hasRole('ADMIN', 'ACCOUNT_MANAGER');

router.get('/', getInvoices);
router.post('/', billingManager, createInvoice);
router.patch('/:id', billingManager, updateInvoice);
router.delete('/:id', billingManager, deleteInvoice);

export default router;
