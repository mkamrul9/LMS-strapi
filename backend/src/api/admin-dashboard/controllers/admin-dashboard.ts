// @ts-nocheck
export default {
  // Helper to ensure only Admins can access these endpoints
  async verifyAdminAccess(ctx, strapi) {
    const user = ctx.state.user;
    if (!user) return false;

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    return fullUser.role?.name === 'Admin';
  },

  // 1. Get Platform Statistics
  async getStats(ctx) {
    const isAdmin = await this.verifyAdminAccess(ctx, strapi);
    if (!isAdmin) return ctx.forbidden('Access denied. Admin only.');

    try {
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

  // 2. Get All Users (with Roles)
  async getUsers(ctx) {
    const isAdmin = await this.verifyAdminAccess(ctx, strapi);
    if (!isAdmin) return ctx.forbidden('Access denied. Admin only.');

    try {
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        populate: ['role'],
        fields: ['id', 'username', 'email', 'createdAt'], // Sanitize output
      });
      
      // Also fetch all available roles so the frontend can populate the dropdown
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        fields: ['id', 'name', 'description'],
      });

      return ctx.send({ data: { users, roles } });
    } catch (err) {
      return ctx.internalServerError('Failed to fetch users');
    }
  },

  // 3. Update User Role
  async updateUserRole(ctx) {
    const isAdmin = await this.verifyAdminAccess(ctx, strapi);
    if (!isAdmin) return ctx.forbidden('Access denied. Admin only.');

    const { id } = ctx.params; // ID of the user being updated
    const { roleId } = ctx.request.body.data || {};

    if (!roleId) {
      return ctx.badRequest('A roleId is required.');
    }

    // Prevent Admin from accidentally removing their own admin status
    if (Number(id) === Number(ctx.state.user.id)) {
      return ctx.badRequest('You cannot change your own role.');
    }

    try {
      // Update the user's role relation
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
