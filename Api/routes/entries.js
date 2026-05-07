/**
 * Entry routes.
 *
 * All routes require authentication (isAuth) and RBAC authorization.
 * user and company are never accepted from the client - they are injected
 * by the controller from the JWT payload.
 *
 * GET    /entries        - list all entries (filtered by role)
 * POST   /entries        - create a new entry
 * GET    /entries/:id    - get a single entry
 * PATCH  /entries/:id    - update an entry
 * DELETE /entries/:id    - delete an entry
 */

const express = require('express');
const controller = require('../controllers/entries');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { validator } = require('../middlewares/validator');

const router = express.Router();

router.route('/').post(validator({ body: 'addEntry' }), isAuth, rbac('entries', 'create'), controller.add);
router
  .route('/:id')
  .delete(validator({ params: 'id' }), isAuth, rbac('entries', 'delete'), controller.delete)
  .get(validator({ params: 'id' }), isAuth, rbac('entries', 'read'), controller.getById)
  .patch(validator({ body: 'updateEntry', params: 'id' }), isAuth, rbac('entries', 'update'), controller.update);
router.route('/').get(isAuth, rbac('entries', 'read'), controller.getAll);

module.exports = router;
