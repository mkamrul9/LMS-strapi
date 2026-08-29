// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::blog.blog', ({ strapi }) => ({
  /**
   * Overrides GET /api/blogs/:id
   * Supports both numeric SQLite IDs and Strapi v5 DocumentIDs.
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    let blog = null;
    if (/^\d+$/.test(id)) {
      blog = await strapi.db.query('api::blog.blog').findOne({
        where: { id: parseInt(id, 10) },
        populate: ['author'],
      });
    } else {
      blog = await strapi.db.query('api::blog.blog').findOne({
        where: { documentId: id },
        populate: ['author'],
      });
    }

    if (!blog) {
      try {
        return await super.findOne(ctx);
      } catch (e) {
        return ctx.notFound('Blog post not found');
      }
    }

    return { data: blog };
  },

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
    
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser?.role?.name === 'Content Manager') {
      const blog = await strapi.db.query('api::blog.blog').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
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

    if (fullUser?.role?.name === 'Content Manager') {
      const blog = await strapi.db.query('api::blog.blog').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
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
