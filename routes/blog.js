const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const User = require('../models/User');
const BlogView = require('../models/BlogView');
const { findOrCreateCategory, resolveCategoryFromParam, slugify } = require('../utils/categoryHelper');
const { attachCommentCounts, getProfileImage } = require('../utils/blogHelper');

async function resolveCategoryFilter(categoryParam) {
  if (!categoryParam) return '';
  const category = await resolveCategoryFromParam(categoryParam);
  return category ? category.name : categoryParam;
}

async function recordUniqueView(blog, userId) {
  if (!userId) return false;

  try {
    const existing = await BlogView.findOne({ blogId: blog._id, userId });
    if (existing) return false;

    await BlogView.create({ blogId: blog._id, userId, viewedAt: new Date() });
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    return true;
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }
}

router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    const categoryFilter = await resolveCategoryFilter(req.query.category || '');

    const query = { published: true };
    if (categoryFilter) {
      const cat = await resolveCategoryFromParam(categoryFilter);
      if (cat) {
        query.$or = [
          { category: cat.name },
          { categorySlug: cat.slug }
        ];
      } else {
        query.category = categoryFilter;
      }
    }

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const blogsWithCounts = await attachCommentCounts(blogs);
    const total = await Blog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render('blog/list', {
      title: 'All Blogs - Voices',
      blogs: blogsWithCounts,
      currentPage: page,
      totalPages,
      category: categoryFilter,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.render('blog/list', {
      title: 'All Blogs - Voices',
      blogs: [],
      currentPage: 1,
      totalPages: 1,
      category: '',
      user: req.session.user
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'create' || req.params.id === 'list') {
      return res.redirect('/blog/' + req.params.id);
    }

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    if (!isValidObjectId) {
      return res.status(404).render('error', {
        error: 'Invalid blog ID format',
        user: req.session.user
      });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', {
        error: 'Blog not found',
        user: req.session.user
      });
    }

    if (!blog.imageUrl) {
      blog.imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80';
    }
    if (!blog.content) {
      blog.content = 'Content coming soon...';
    }
    if (!blog.excerpt) {
      blog.excerpt = blog.content.substring(0, 150) + '...';
    }

    if (req.session.user) {
      await recordUniqueView(blog, req.session.user.id);
    }

    const comments = await Comment.find({ blogId: blog._id })
      .sort({ createdAt: -1 })
      .lean();

    for (const comment of comments) {
      if (!comment.authorImage && comment.authorId) {
        const authorUser = await User.findById(comment.authorId).lean();
        comment.authorImage = getProfileImage(authorUser);
      }
    }

    const commentCount = comments.length;
    const scrollToComments = req.query.comments === '1';

    const relatedBlogs = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      published: true
    })
      .limit(3)
      .exec();

    const relatedWithCounts = await attachCommentCounts(relatedBlogs);

    res.render('blog/detail', {
      title: blog.title + ' - Voices',
      blog,
      comments,
      commentCount,
      relatedBlogs: relatedWithCounts,
      scrollToComments,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).render('error', {
      error: 'Error loading blog. Please try again later.',
      user: req.session.user
    });
  }
});

router.get('/create/new', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('blog/create', {
    title: 'Create New Blog - Voices',
    user: req.session.user
  });
});

router.post('/create', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { title, content, excerpt, category, tags, imageUrl } = req.body;
    const categoryDoc = await findOrCreateCategory(category, req.session.user.id);

    const blog = new Blog({
      title,
      content,
      excerpt,
      author: req.session.user.username,
      authorId: req.session.user.id,
      category: categoryDoc.name,
      categorySlug: categoryDoc.slug,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      imageUrl: imageUrl || '/images/default-blog.jpg'
    });

    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.render('blog/create', {
      title: 'Create New Blog - Voices',
      error: 'Error creating blog. Check category name and try again.',
      user: req.session.user
    });
  }
});

router.get('/edit/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { error: 'Blog not found' });
    }

    if (blog.authorId.toString() !== req.session.user.id) {
      return res.status(403).render('error', { error: 'Unauthorized' });
    }

    res.render('blog/edit', {
      title: 'Edit Blog - Voices',
      blog,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blog for edit:', error);
    res.status(500).render('error', { error: 'Error loading blog' });
  }
});

router.post('/edit/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { title, content, excerpt, category, tags, imageUrl } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { error: 'Blog not found' });
    }

    if (blog.authorId.toString() !== req.session.user.id) {
      return res.status(403).render('error', { error: 'Unauthorized' });
    }

    const categoryDoc = await findOrCreateCategory(category, req.session.user.id);

    blog.title = title;
    blog.content = content;
    blog.excerpt = excerpt;
    blog.category = categoryDoc.name;
    blog.categorySlug = categoryDoc.slug;
    blog.tags = tags ? tags.split(',').map((t) => t.trim()) : [];
    blog.imageUrl = imageUrl || blog.imageUrl;
    blog.updatedAt = Date.now();

    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).render('error', { error: 'Error updating blog' });
  }
});

router.post('/delete/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { error: 'Blog not found' });
    }

    if (blog.authorId.toString() !== req.session.user.id) {
      return res.status(403).render('error', { error: 'Unauthorized' });
    }

    await Comment.deleteMany({ blogId: blog._id });
    await BlogView.deleteMany({ blogId: blog._id });
    await Blog.findByIdAndDelete(req.params.id);

    res.redirect('/blog/list');
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).render('error', { error: 'Error deleting blog' });
  }
});

router.post('/:id/comment', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { content } = req.body;
    const profileUser = await User.findById(req.session.user.id).lean();
    const authorImage = getProfileImage(profileUser);

    const comment = new Comment({
      blogId: req.params.id,
      author: req.session.user.username,
      authorId: req.session.user.id,
      authorImage,
      content
    });

    await comment.save();
    res.redirect(`/blog/${req.params.id}#comments`);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.redirect(`/blog/${req.params.id}#comments`);
  }
});

module.exports = router;
