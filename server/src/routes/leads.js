import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import Lead from '../models/Lead.js';

const router = Router();
const sources = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const statuses = ['New', 'Contacted', 'Qualified', 'Lost'];
const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('source').isIn(sources).withMessage('Select a valid source'),
  body('status').optional().isIn(statuses).withMessage('Select a valid status')
];
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Please check the form fields.', errors: errors.array() });
  next();
};

router.get('/', async (req, res, next) => {
  try {
    const { search = '', status = '' } = req.query;
    const filter = {};
    if (status && statuses.includes(status)) filter.status = status;
    if (search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { company: rx }, { email: rx }];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (e) { next(e); }
});

router.get('/:id', param('id').isMongoId(), validate, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    res.json(lead);
  } catch (e) { next(e); }
});

router.post('/', rules, validate, async (req, res, next) => {
  try { res.status(201).json(await Lead.create(req.body)); }
  catch (e) { next(e); }
});

router.put('/:id', [param('id').isMongoId(), ...rules], validate, async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    res.json(lead);
  } catch (e) { next(e); }
});

router.delete('/:id', param('id').isMongoId(), validate, async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ message: 'Lead deleted successfully.' });
  } catch (e) { next(e); }
});

export default router;
