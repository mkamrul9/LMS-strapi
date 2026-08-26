// @ts-nocheck  
export default {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    // 1. Define the mandatory roles from the project spec
    const requiredRoles = ['Admin', 'Content Manager', 'Instructor', 'Student'];
    const roleService = strapi.query('plugin::users-permissions.role');

    // 2. Seed missing roles
    for (const roleName of requiredRoles) {
      const existingRole = await roleService.findOne({
        where: { name: roleName },
      });

      if (!existingRole) {
        await roleService.create({
          data: {
            name: roleName,
            description: `${roleName} role generated via bootstrap`,
            type: roleName.toLowerCase().replace(' ', '_'),
          },
        });
        strapi.log.info(`✅ Seeded Role: ${roleName}`);
      }
    }

    // 3. Set 'Student' as the default role for new registrations
    try {
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      });

      const advancedConfig = await pluginStore.get();
      const studentRole = await roleService.findOne({ where: { name: 'Student' } });

      if (studentRole && advancedConfig.default_role !== studentRole.id) {
        await pluginStore.set({
          value: {
            ...advancedConfig,
            default_role: studentRole.id,
          },
        });
        strapi.log.info(`✅ Default registration role set to: Student`);
      }
    } catch (error) {
      strapi.log.error(`❌ Failed to set default role: ${error.message}`);
    }
  },
};
