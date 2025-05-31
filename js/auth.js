// Authentication functions
async function register(email, password, username) {
    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Registration error:', error);
        return { data: null, error };
    }
}

async function login(email, password) {
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Login error:', error);
        return { data: null, error };
    }
}

async function logout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Logout error:', error);
        return { error };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            return { user, profile };
        }
        return null;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// Export functions
window.auth = {
    register,
    login,
    logout,
    getCurrentUser
}; 