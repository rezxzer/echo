// DOM Elements
const usersList = document.getElementById('usersList');
const searchUser = document.getElementById('searchUser');
const userFilter = document.getElementById('userFilter');
const userActionsModal = new bootstrap.Modal(document.getElementById('userActionsModal'));

// State
let users = [];
let filteredUsers = [];

// Initialize user management
async function initUserManagement() {
    try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const { data: adminData, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (error || !adminData?.is_admin) {
            window.location.href = '/';
            return;
        }

        // Load users
        await loadUsers();

        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error initializing user management:', error);
        showError('Failed to load user management');
    }
}

// Load users
async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        users = data;
        filteredUsers = [...users];
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

// Render users
function renderUsers() {
    usersList.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${user.avatar_url || 'https://via.placeholder.com/40'}" 
                         class="rounded-circle me-2" 
                         width="40" 
                         height="40"
                         alt="${user.username}">
                    <div>
                        <div class="fw-bold">${user.username}</div>
                        <small class="text-muted">ID: ${user.id}</small>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(user.status)}">
                    ${user.status}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="showUserActions('${user.id}')">
                        <i class="fas fa-exclamation-triangle"></i>
                    </button>
                    ${user.status === 'active' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status) {
        case 'active':
            return 'bg-success';
        case 'suspended':
            return 'bg-warning';
        case 'banned':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// View user details
async function viewUserDetails(userId) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // TODO: Implement user details view
        console.log('View user details:', user);
    } catch (error) {
        console.error('Error loading user details:', error);
        showError('Failed to load user details');
    }
}

// Show user actions modal
function showUserActions(userId) {
    document.getElementById('userId').value = userId;
    userActionsModal.show();
}

// Execute user action
async function executeUserAction() {
    try {
        const userId = document.getElementById('userId').value;
        const actionType = document.getElementById('actionType').value;
        const actionDuration = document.getElementById('actionDuration').value;
        const actionReason = document.getElementById('actionReason').value;

        if (!actionReason) {
            showError('Please provide a reason for the action');
            return;
        }

        const action = {
            user_id: userId,
            type: actionType,
            duration: actionDuration,
            reason: actionReason,
            executed_by: (await supabase.auth.getUser()).data.user.id,
            executed_at: new Date().toISOString()
        };

        // Update user status
        let newStatus = 'active';
        if (actionType === 'suspend') {
            newStatus = 'suspended';
        } else if (actionType === 'ban') {
            newStatus = 'banned';
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                status: newStatus,
                status_until: actionDuration === 'permanent' ? null : 
                    new Date(Date.now() + parseInt(actionDuration) * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Log the action
        const { error: logError } = await supabase
            .from('user_actions')
            .insert([action]);

        if (logError) throw logError;

        // Close modal and refresh users
        userActionsModal.hide();
        await loadUsers();
        showSuccess('Action executed successfully');
    } catch (error) {
        console.error('Error executing user action:', error);
        showError('Failed to execute action');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        await loadUsers();
        showSuccess('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user');
    }
}

// Filter users
function filterUsers() {
    const searchTerm = searchUser.value.toLowerCase();
    const statusFilter = userFilter.value;

    filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
                            user.email.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    renderUsers();
}

// Add event listeners
function addEventListeners() {
    // Search and filter
    searchUser.addEventListener('input', filterUsers);
    userFilter.addEventListener('change', filterUsers);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error logging out:', error);
            showError('Failed to log out');
        }
    });
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Show error message
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Initialize user management when DOM is loaded
document.addEventListener('DOMContentLoaded', initUserManagement); 