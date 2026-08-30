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

    const bodyData = ctx.request.body?.data || ctx.request.body || {};
    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: user.id } });
    const authorIdentifier = fullUser?.documentId || user.id;

    try {
      const newBlog = await strapi.documents('api::blog.blog').create({
        data: {
          title: bodyData.title,
          content: bodyData.content,
          coverImageUrl: bodyData.coverImageUrl,
          author: authorIdentifier,
        },
        status: bodyData.publishedAt ? 'published' : 'draft'
      });
      return ctx.send({ data: newBlog });
    } catch (err) {
      const newBlog = await strapi.entityService.create('api::blog.blog', {
        data: {
          title: bodyData.title,
          content: bodyData.content,
          coverImageUrl: bodyData.coverImageUrl,
          author: user.id,
          publishedAt: bodyData.publishedAt || new Date(),
        }
      });
      return ctx.send({ data: newBlog });
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;
    const bodyData = ctx.request.body?.data || ctx.request.body || {};

    try {
      let docId = id;
      if (/^\d+$/.test(id)) {
        const found = await strapi.db.query('api::blog.blog').findOne({ where: { id: parseInt(id, 10) } });
        if (found?.documentId) docId = found.documentId;
      }
      const updated = await strapi.documents('api::blog.blog').update({
        documentId: docId,
        data: {
          title: bodyData.title,
          content: bodyData.content,
          coverImageUrl: bodyData.coverImageUrl,
        },
        status: bodyData.publishedAt ? 'published' : 'draft'
      });
      return ctx.send({ data: updated });
    } catch (err) {
      return await super.update(ctx);
    }
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;

    return await super.delete(ctx);
  }
}));
