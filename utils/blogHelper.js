const Comment = require('../models/Comment');

async function attachCommentCounts(blogs) {
  if (!blogs || blogs.length === 0) return blogs;

  const ids = blogs.map((b) => b._id);
  const counts = await Comment.aggregate([
    { $match: { blogId: { $in: ids } } },
    { $group: { _id: '$blogId', count: { $sum: 1 } } }
  ]);

  const map = counts.reduce((acc, row) => {
    acc[row._id.toString()] = row.count;
    return acc;
  }, {});

  return blogs.map((blog) => {
    const plain = blog.toObject ? blog.toObject() : { ...blog };
    plain.commentCount = map[plain._id.toString()] || 0;
    return plain;
  });
}

function getProfileImage(user) {
  if (!user) return '';
  return user.avatarUrl || user.profileImage || '';
}

function getProfileUrl(username) {
  if (!username) return '#';
  return `/profile?u=${encodeURIComponent(username)}`;
}

module.exports = {
  attachCommentCounts,
  getProfileImage,
  getProfileUrl
};
