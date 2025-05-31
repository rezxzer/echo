const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = `${req.user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    // Save file metadata to database
    const { data: fileData, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          user_id: req.user.id,
          name: file.originalname,
          path: filePath,
          url: publicUrl,
          size: file.size,
          type: file.mimetype
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileData
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Get user's files
router.get('/', auth, async (req, res) => {
  try {
    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(files);
  } catch (error) {
    console.error('Files fetch error:', error);
    res.status(500).json({ message: 'Error fetching files' });
  }
});

// Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user owns the file
    if (file.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }

    res.json(file);
  } catch (error) {
    console.error('File fetch error:', error);
    res.status(500).json({ message: 'Error fetching file' });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user owns the file
    if (file.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', req.params.id);

    if (dbError) throw dbError;

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

module.exports = router; 