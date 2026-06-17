const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateUniqueSlug = async (Post, baseSlug) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Post.findOne({ where: { slug } });
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = {
  generateSlug,
  generateUniqueSlug
};
