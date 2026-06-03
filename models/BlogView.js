const mongoose = require('mongoose');

const blogViewSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
});

blogViewSchema.index({ blogId: 1, userId: 1 }, { unique: true });
blogViewSchema.index({ blogId: 1, viewedAt: -1 });

module.exports = mongoose.model('BlogView', blogViewSchema);
