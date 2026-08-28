// @ts-nocheck

/**
 * Admin Dashboard Custom Controller
 * 
 * Provides specialized, aggregated endpoints dedicated entirely to the superuser (Admin) role.
 * Consolidates platform-wide metrics and enables dangerous mutation capabilities (e.g. promoting roles).
 */
export default {
  
  /**
   * Internal Guard Hook
   * Validates that the executing user definitively holds the 'Admin' role before proceeding.
   * 
   * @param {object} ctx - Koa Context
   * @param {object} strapi - Global Strapi instance
   * @returns {Promise<boolean>} True if authorized Admin, false otherwise.
   */
  async verifyAdminAccess(ctx, strapi) {
    const user = ctx.state.user;
    if (!user) return false;

    // Deep populate to verify role mathematically against the DB, ignoring client-side claims.
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    return fullUser.role?.name === 'Admin';
  },

  /**
   * GET /api/admin-dashboard/stats
   * 
   * Aggregates global platform usage metrics for the Admin dashboard cards.
   */
  async getStats(ctx) {
    const isAdmin = await this.verifyAdminAccess(ctx, strapi);
    if (!isAdmin) return ctx.forbidden('Access denied. Admin only.');

    try {
      // Execute parallel count queries across core tables
      const totalUsers = await strapi.db.query('plugin::users-permissions.user').count();
      const totalCourses = await strapi.db.query('api::course.course').count();
      const totalEnrollments = await strapi.db.query('api::enrollment.enrollment').count();
      const totalLessons = await strapi.db.query('api::lesson.lesson').count();

      return ctx.send({
        data: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          totalLessons
        }
      });
    } catch (err) {
      return ctx.internalServerError('Failed to fetch platform stats');
    }
  },

  /**
   * GET /api/admin-dashboard/users
   * 
   * Retrieves all users (for management) along with all available roles (to populate dropdowns).
   */
  async getUsers(ctx) {
    const isAdmin = await this.verifyAdminAccess(ctx, strapi);
    if (!isAdmin) return ctx.forbidden('Access denied. Admin only.');

    try {
      // 1. Fetch Users, explicitly sanitizing the fields array to exclude password hashes
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        populate: ['role'],
        fields: ['id', 'username', 'email', 'createdAt'], 
      });
      
      // 2. Fetch the Role dictionary for the client-side select inputs
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        fields: ['id', 'name', 'description'],
      });

      return ctx.send({ data: { users, roles } });
    } catch (err) {
      return ctx.internalServerError('Failed to fetch users');
    }
  },

  /**
   * PUT /api/admin-dashboard/users/:id/role
   * 
   * Elevates or demotes a user's permissions by modifying their relational role mapping.
   */
  async updateUserRole(ctx) {
    const isAdmin = await this.verifyAdminAccess(ctx, strapi);
    if (!isAdmin) return ctx.forbidden('Access denied. Admin only.');

    const { id } = ctx.params; // Target user ID
    const { roleId } = ctx.request.body.data || {}; // New Role ID

    if (!roleId) {
      return ctx.badRequest('A roleId is required.');
    }

    // Safety Guard: Prevent an Admin from inadvertently locking themselves out by demoting their own account.
    if (Number(id) === Number(ctx.state.user.id)) {
      return ctx.badRequest('You cannot change your own role.');
    }

    try {
      // Execute the relational mutation
      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: {
          role: roleId
        },
        populate: ['role'],
      });

      return ctx.send({
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role.name
        }
      });
    } catch (err) {
      return ctx.internalServerError('Failed to update user role');
    }
  },
};
