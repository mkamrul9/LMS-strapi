// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::blog.blog', ({ strapi }) => ({
  
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    // 1. Force the logged-in user as the author to prevent identity spoofing
    if (ctx.request.body.data) {
      ctx.request.body.data.author = user.id;
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;
    
    // Fetch the user's role
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    // 2. Ownership check for Content Managers (Admins bypass this automatically)
    if (fullUser.role.name === 'Content Manager') {
      const blog = await strapi.entityService.findOne('api::blog.blog', id, {
        populate: ['author'],
      });
      
      if (!blog) return ctx.notFound('Blog post not found.');
      
      if (blog.author?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only edit your own blog posts.');
      }
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    // 3. Ownership check for Content Managers deleting posts
    if (fullUser.role.name === 'Content Manager') {
      const blog = await strapi.entityService.findOne('api::blog.blog', id, {
        populate: ['author'],
      });
      
      if (!blog) return ctx.notFound('Blog post not found.');
      
      if (blog.author?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete your own blog posts.');
      }
    }

    return await super.delete(ctx);
  }
}));
