import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  company: { type: String, required: true, trim: true, maxlength: 120 },
  source: { type: String, required: true, enum: ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'] },
  status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Lost'], default: 'New' }
}, { timestamps: true });

leadSchema.index({ name: 'text', company: 'text', email: 'text' });
export default mongoose.model('Lead', leadSchema);
