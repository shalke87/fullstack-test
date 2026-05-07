/**
 * AJV validation schemas for entry endpoints.
 *
 * Note: user and company fields are intentionally excluded from both schemas.
 * They are injected server-side from the JWT (res.locals.user) in the controller
 * to prevent clients from creating or updating entries on behalf of other users.
 *
 * Error codes (e.g. '210') map to client-side error messages via the response helper.
 * addEntry requires all fields, updateEntry allows partial updates.
 */

module.exports.addEntry = {
  $id: 'addEntry',
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['income', 'expense'] },
    amount: { type: 'number', minimum: 0 },
    description: { type: 'string', maxLength: 256 },
    date: { type: 'string', format: 'date-time' }
  },
  additionalProperties: false,
  required: ['type', 'amount', 'date', 'description'],
  errorMessage: {
    properties: {
      type: '210',
      amount: '210',
      date: '210',
      description: '210'
    }
  }
};

module.exports.updateEntry = {
  $id: 'updateEntry',
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['income', 'expense'] },
    amount: { type: 'number', minimum: 0 },
    description: { type: 'string', maxLength: 256 },
    date: { type: 'string', format: 'date-time' }
  },
  additionalProperties: false,
  errorMessage: {
    properties: {
      type: '210',
      amount: '210',
      date: '210',
      description: '210'
    }
  }
};
