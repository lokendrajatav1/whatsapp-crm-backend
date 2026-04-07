import { Router } from 'express';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../controllers/invoice.controller';
import { protect, hasRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

// Invoices managed by ACCOUNT_MANAGER and ADMIN
const financeManager = hasRole('ADMIN', 'ACCOUNT_MANAGER');

router.get('/', getInvoices);
router.post('/', financeManager, createInvoice);
router.patch('/:id', financeManager, updateInvoice);
router.delete('/:id', financeManager, deleteInvoice);

export default router;
