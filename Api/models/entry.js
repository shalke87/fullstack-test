const mongoose = require('mongoose');
const dbFields = require('../helpers/dbFields');

const { Schema } = mongoose;

/**
 * Entry model - represents a single income or expense record.
 *
 * Design decisions:
 * - user and company are embedded (denormalized) instead of referenced to avoid
 *   additional queries on read. This follows the same pattern used in the User model.
 * - _id is disabled on subdocuments since they are not independent documents.
 * - company is optional because a user may not belong to any company (e.g. superuser).
 * - date is the actual transaction date, separate from createdAt which tracks
 *   when the record was inserted in the database.
 */
const schema = Schema(
  {
    // Embedded user reference - id is required, fullname is denormalized for display
    user: {
      _id: false,
      id: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
      fullname: { type: String }
    },
    // Embedded company reference - optional, absent for users without a company
    company: {
      _id: false,
      id: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
      name: { type: String }
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      maxlength: 256,
      trim: true
    },
    // Transaction date - may differ from createdAt if the user logs a past transaction
    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// dbFields plugin defines which fields are returned by default in list queries
// via the getter helper
schema.plugin(dbFields, {
  fields: {
    listing: ['_id', 'user', 'company', 'type', 'amount', 'description', 'date', 'createdAt', 'updatedAt']
  }
});

// Guard against model recompilation in test environments where modules may be reloaded
module.exports = mongoose.models.Entry || mongoose.model('Entry', schema);
