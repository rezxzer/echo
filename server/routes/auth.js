const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) throw authError;

        // Create user profile in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    username: username,
                    email: email
                }
            ]);

        if (profileError) throw profileError;

        res.status(201).json({
            message: 'User registered successfully',
            user: authData.user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        res.json({
            message: 'Login successful',
            user: data.user,
            session: data.session
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            message: 'Login failed',
            error: error.message
        });
    }
});

// Logout user
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: 'Logout failed',
            error: error.message
        });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        if (!user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        res.json({
            user: {
                ...user,
                profile
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            message: 'Failed to get user',
            error: error.message
        });
    }
});

module.exports = router; 