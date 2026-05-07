/**
 * Core RBAC function for entry resources.
 * Authorization hierarchy (first match wins):
 * 1. superuser - can access any entry
 * 2. admin of the same company - can access all entries belonging to their company
 * 3. entry owner - can access their own entry regardless of role
 *
 * Returns the entry document if authorized, null if not found, false if unauthorized.
 * This pattern is consistent with the rest of the project (see rbac/users.js).
 *
 * Note: unlike users.js, there is no onHimself option because ownership is checked
 * directly via entry.user.id instead of comparing resource id to caller id.
 */

const Entry = require('../models/entry');
const { intersection } = require('../helpers/utils');

const entryRbac = async (caller, resourceId, { authorizedRoles = [] }) => {
  const entry = await Entry.findById(resourceId, {});
  if (!entry) return null;

  const { id: _id, company, roles: globalRoles } = caller;
  const { roles: companyRoles } = company;
  const roles = Array.from(new Set([...companyRoles, ...globalRoles]));

  if (roles.includes('superuser')) return entry;

  if (company?.id?.toString() === entry?.company?.id?.toString() && intersection(authorizedRoles, roles).length)
    return entry;

  if (entry?.user?.id?.toString() === _id.toString()) return entry;

  return false;
};

module.exports.entryRbac = entryRbac;

module.exports.canGetEntry = (caller, resourceId) => entryRbac(caller, resourceId, { authorizedRoles: ['admin'] });

module.exports.canUpdateEntry = (caller, resourceId) => entryRbac(caller, resourceId, { authorizedRoles: ['admin'] });

module.exports.canDeleteEntry = (caller, resourceId) => entryRbac(caller, resourceId, { authorizedRoles: ['admin'] });
