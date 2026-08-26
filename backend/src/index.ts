export default {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    // 1. Define the mandatory roles from the project spec
    const requiredRoles = ['Admin', 'Content Manager', 'Instructor', 'Student'];

    // 2. Access the users-permissions role service
    const roleService = strapi.query('plugin::users-permissions.role');

    for (const roleName of requiredRoles) {
      // Check if the role already exists
      const existingRole = await roleService.findOne({
        where: { name: roleName },
      });

      if (!existingRole) {
        // Create the role if missing. 
        // Note: 'Authenticated' and 'Public' are default Strapi types. 
        // We set ours to custom types so they don't conflict with defaults.
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
  },
};
