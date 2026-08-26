// @ts-nocheck  
export default {
  beforeCreate(event) {
    const { data } = event.params;

    // Provide a default placeholder if no image URL is supplied
    if (!data.coverImageUrl) {
      data.coverImageUrl = 'https://placehold.co/800x400?text=Course+Cover';
    }
  },
};
