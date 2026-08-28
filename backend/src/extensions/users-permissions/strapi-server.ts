// @ts-nocheck
/**
 * Strapi Server Extension for users-permissions plugin
 * 
 * Overrides the `me` action to safely populate the user's relational `role`
 * so frontend RBAC and Next.js middleware can inspect user.role.name without extra lookups.
 */
export default (plugin) => {
  const originalMe = plugin.controllers.user.me;

  plugin.controllers.user.me = async (ctx) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized();
    }

    // Retrieve the user from the entityService populated with the role object
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (!fullUser) {
      return ctx.notFound();
    }

    return {
      id: fullUser.id,
      documentId: fullUser.documentId,
      username: fullUser.username,
      email: fullUser.email,
      confirmed: fullUser.confirmed,
      blocked: fullUser.blocked,
      role: fullUser.role ? {
        id: fullUser.role.id,
        name: fullUser.role.name,
        description: fullUser.role.description,
        type: fullUser.role.type,
      } : null,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    };
  };

  return plugin;
};
