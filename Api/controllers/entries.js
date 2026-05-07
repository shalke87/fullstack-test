const { intersection } = require('lodash');
const { SendData, ServerError, NotFound, Unauthorized } = require('../helpers/response');
const entryModel = require('../models/entry');
const { canGetEntry, canUpdateEntry, canDeleteEntry } = require('../rbac/entries');
const getter = require('../helpers/getter');

/**
 * Add a new entry for the authenticated user.
 * user and company are taken from the JWT via res.locals, not from the request body,
 * to prevent users from creating entries on behalf of others.
 */
module.exports.add = async (req, res, next) => {
  try {
    const entryData = req.body;
    const { user } = res.locals;

    entryData.user = { id: user.id };

    // company is optional - superusers and users without a company won't have it
    if (user.company?.id) {
      entryData.company = { id: user.company.id, name: user.company.name };
    }

    const entry = await entryModel.create(entryData);

    return next(SendData(entry, 201));
  } catch (err) {
    return next(ServerError(err));
  }
};

/**
 * Get a single entry by id.
 * Access is controlled by canGetEntry: superuser sees all, admin sees company entries,
 * user sees only own entries.
 */
module.exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user } = res.locals;

    const entry = await canGetEntry(user, id);
    if (entry === null) return next(NotFound());
    if (!entry) return next(Unauthorized());

    return next(SendData(entry));
  } catch (err) {
    return next(ServerError(err));
  }
};

/**
 * Update an entry by id.
 * Uses Object.assign to merge only the fields provided in the request body,
 * then saves the full document. Access is controlled by canUpdateEntry.
 */
module.exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user } = res.locals;
    const entryData = req.body;

    const entry = await canUpdateEntry(user, id);
    if (entry === null) return next(NotFound());
    if (!entry) return next(Unauthorized());

    Object.assign(entry, entryData);
    await entry.save();

    return next(SendData(entry));
  } catch (err) {
    return next(ServerError(err));
  }
};

/**
 * Delete an entry by id.
 * Uses deleteOne instead of softDelete since the Entry model
 * does not include the softDelete plugin.
 */
module.exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user } = res.locals;

    const entry = await canDeleteEntry(user, id);
    if (entry === null) return next(NotFound());
    if (!entry) return next(Unauthorized());

    await entry.deleteOne();

    return next(SendData({ message: 'Entry deleted successfully' }, 200));
  } catch (err) {
    return next(ServerError(err));
  }
};

/**
 * Get all entries filtered by role:
 * - superuser (grants.type === 'any'): sees all entries
 * - admin: sees all entries belonging to their company
 * - user: sees only their own entries
 *
 * Uses the getter helper for cursor-based pagination and sorting.
 */
module.exports.getAll = async (req, res, next) => {
  try {
    const { user, grants } = res.locals;

    let query = {};
    if (grants.type === 'any') {
      query = {};
    } else if (user.company?.id && intersection(user.company.roles, ['admin']).length) {
      query = { 'company.id': user.company.id };
    } else {
      query = { 'user.id': user.id };
    }

    const data = await getter(entryModel, query, req, res);
    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};
