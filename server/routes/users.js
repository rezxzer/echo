const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('fullName').optional().trim().notEmpty(),
  body('bio').optional().trim(),
  body('avatar').optional().isURL(),
  body('coverPhoto').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, bio, avatar, coverPhoto } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (coverPhoto) user.coverPhoto = coverPhoto;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Follow user
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following and followers
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Error following user' });
  }
});

// Unfollow user
router.post('/unfollow/:userId', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), userToUnfollow.save()]);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ message: 'Error unfollowing user' });
  }
});

// Get user's followers
router.get('/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('followers', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.followers);
  } catch (error) {
    console.error('Followers fetch error:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
});

// Get user's following
router.get('/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('following', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    console.error('Following fetch error:', error);
    res.status(500).json({ message: 'Error fetching following' });
  }
});

module.exports = router; 