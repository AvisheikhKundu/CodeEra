/**
 * Profile State Management for CodeEra
 * Handles dynamic profile icon behavior based on login status
 */

// Check if user is logged in and update profile section
async function updateProfileSection() {
    try {
        const response = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include'
        });
        
        const profileDropdownContainer = document.getElementById('profileDropdownContainer');
        const profileDirectLink = document.getElementById('profileDirectLink');
        
        if (response.ok) {
            // User is logged in - show direct profile link
            if (profileDropdownContainer) profileDropdownContainer.style.display = 'none';
            if (profileDirectLink) profileDirectLink.style.display = 'block';
        } else {
            // User is not logged in - show dropdown with login/signup
            if (profileDropdownContainer) profileDropdownContainer.style.display = 'block';
            if (profileDirectLink) profileDirectLink.style.display = 'none';
        }
    } catch (error) {
        // Error or not logged in - show dropdown
        const profileDropdownContainer = document.getElementById('profileDropdownContainer');
        const profileDirectLink = document.getElementById('profileDirectLink');
        if (profileDropdownContainer) profileDropdownContainer.style.display = 'block';
        if (profileDirectLink) profileDirectLink.style.display = 'none';
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        // Update profile section to show login/signup options
        updateProfileSection();
        // Redirect to home page
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout request fails
        window.location.href = '/index.html';
    }
}

// Initialize profile section management
function initProfileState() {
    // Update profile section on page load
    updateProfileSection();
    
    // Update profile section when page becomes visible (for better UX)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updateProfileSection();
        }
    });
    
    // Add logout functionality to logout buttons
    const logoutButtons = document.querySelectorAll('#logoutBtn, .logout-btn');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', logout);
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileState);
} else {
    initProfileState();
}

// Export functions for manual use
window.updateProfileSection = updateProfileSection;
window.logout = logout;
window.initProfileState = initProfileState;
