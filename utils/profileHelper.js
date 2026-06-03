const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

async function buildProfileViewData(userId, tab = 'popular') {
  const profileUser = await User.findById(userId).lean();
  if (!profileUser) return null;

  const blogs = await Blog.find({ authorId: userId, published: true }).lean();
  const blogIds = blogs.map((blog) => blog._id);

  const commentCounts = await Comment.aggregate([
    { $match: { blogId: { $in: blogIds } } },
    { $group: { _id: '$blogId', count: { $sum: 1 } } }
  ]);

  const commentMap = commentCounts.reduce((map, item) => {
    map[item._id.toString()] = item.count;
    return map;
  }, {});

  blogs.forEach((blog) => {
    blog.commentCount = commentMap[blog._id.toString()] || 0;
  });

  let sortedBlogs = [...blogs];

  if (tab === 'recommended') {
    sortedBlogs.sort(
      (a, b) =>
        (b.likes || 0) + (b.commentCount || 0) - ((a.likes || 0) + (a.commentCount || 0))
    );
  } else if (tab === 'newest') {
    sortedBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    sortedBlogs.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  const totalBlogs = blogs.length;
  const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
  const totalComments = blogs.reduce((sum, blog) => sum + (blog.commentCount || 0), 0);

  return {
    profileUser,
    blogs: sortedBlogs,
    tab,
    totalBlogs,
    totalViews,
    totalComments
  };
}

module.exports = { buildProfileViewData };
