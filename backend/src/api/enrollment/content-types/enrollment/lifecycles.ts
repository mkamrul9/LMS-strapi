export default {
  beforeCreate(event) {
    const { data } = event.params;

    // Automatically set enrolledAt to the current server timestamp
    data.enrolledAt = new Date().toISOString();
  },
};
