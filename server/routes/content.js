const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Create new content
router.post('/', auth, [
  body('title').trim().notEmpty(),
  body('content').trim().notEmpty(),
  body('type').optional().isIn(['post', 'video']),
  body('media').optional().isURL(),
  body('thumbnail').optional().isURL(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, type = 'post', media, thumbnail, tags } = req.body;

    const { data, error } = await supabase
      .from('content')
      .insert([
        {
          user_id: req.user.id,
          title,
          content,
          type,
          media,
          thumbnail,
          tags
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Content created successfully',
      content: data
    });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ message: 'Error creating content' });
  }
});

// Get all content (with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const search = req.query.search;

    let query = supabase
      .from('content')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: content, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .count();

    if (error) throw error;

    res.json({
      content,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalContent: count
    });
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({ message: 'Error fetching content' });
  }
});

// Get single content by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: content, error } = await supabase
      .from('content')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Increment views
    const { error: updateError } = await supabase
      .from('content')
      .update({ views: (content.views || 0) + 1 })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    res.json(content);
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({ message: 'Error fetching content' });
  }
});

// Update content
router.put('/:id', auth, [
  body('title').optional().trim().notEmpty(),
  body('content').optional().trim().notEmpty(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user is the author
    if (content.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this content' });
    }

    const { title, content: newContent, tags } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (newContent) updates.content = newContent;
    if (tags) updates.tags = tags;

    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Content update error:', error);
    res.status(500).json({ message: 'Error updating content' });
  }
});

// Delete content
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user is the author
    if (content.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this content' });
    }

    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Content deletion error:', error);
    res.status(500).json({ message: 'Error deleting content' });
  }
});

// Like/Unlike content
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const likes = content.likes || [];
    const likeIndex = likes.indexOf(req.user.id);

    let newLikes;
    if (likeIndex === -1) {
      // Like
      newLikes = [...likes, req.user.id];
    } else {
      // Unlike
      newLikes = likes.filter(id => id !== req.user.id);
    }

    const { error: updateError } = await supabase
      .from('content')
      .update({ likes: newLikes })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    res.json({
      message: likeIndex === -1 ? 'Content liked' : 'Content unliked',
      likes: newLikes.length
    });
  } catch (error) {
    console.error('Like/Unlike error:', error);
    res.status(500).json({ message: 'Error processing like/unlike' });
  }
});

// Add comment
router.post('/:id/comments', auth, [
  body('content').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const content = await supabase
      .from('content')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const comment = {
      user_id: req.user.id,
      content: req.body.content
    };

    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update({ comments: [...(content.comments || []), comment] })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Populate user info for the new comment
    const { data: populatedContent, error: populateError } = await supabase
      .from('content')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (populateError) throw populateError;

    res.json({
      message: 'Comment added successfully',
      comment: populatedContent.comments[populatedContent.comments.length - 1]
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

module.exports = router; 