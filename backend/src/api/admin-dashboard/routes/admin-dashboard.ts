export default {
  routes: [
    {
      method: 'GET',
      path: '/admin-dashboard/stats',
      handler: 'admin-dashboard.getStats',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/admin-dashboard/users',
      handler: 'admin-dashboard.getUsers',
      config: { policies: [] },
    },
    {
      method: 'PUT',
      path: '/admin-dashboard/users/:id/role',
      handler: 'admin-dashboard.updateUserRole',
      config: { policies: [] },
    },
  ],
};
