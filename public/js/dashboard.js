// Dashboard JavaScript

// Modal functionality (supports multiple modals: edit listing + profile view)
const modal = document.getElementById('editModal');
const profileModal = document.getElementById('profileModal');

document.querySelectorAll('.modal .close').forEach(closeEl => {
    closeEl.addEventListener('click', () => {
        closeEl.closest('.modal').style.display = 'none';
    });
});

window.onclick = function(event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Fetch and populate listing data for edit
async function populateEditModal(listingId) {
    try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) throw new Error('Failed to fetch listing');
        
        const listing = await response.json();
        
        document.getElementById('editListingId').value = listing.id;
        document.getElementById('editTitle').value = listing.title || '';
        document.getElementById('editDescription').value = listing.description || '';
        document.getElementById('editCity').value = listing.city || '';
        document.getElementById('editArea').value = listing.area || '';
        document.getElementById('editRent').value = listing.rent || '';
        document.getElementById('editAvailableFrom').value = listing.available_from ? listing.available_from.split('T')[0] : '';
        document.getElementById('editCurrentOccupants').value = listing.current_occupants || 0;
        document.getElementById('editOccupancy').value = listing.occupancy || 1;
        document.getElementById('editFurnished').value = listing.furnished ? 'true' : 'false';
        document.getElementById('editGenderPreference').value = listing.gender_preference || '';
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching listing:', error);
        alert('Error loading listing data');
    }
}

// Edit listing buttons
document.querySelectorAll('.edit-listing-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const listingId = btn.getAttribute('data-id');
        populateEditModal(listingId);
    });
});

// Delete listing
document.querySelectorAll('.delete-listing-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const listingId = btn.getAttribute('data-id');
        
        if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/listings/${listingId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                alert('Listing deleted successfully');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(error.error || 'Error deleting listing');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting listing');
        }
    });
});

// Edit form submission
document.getElementById('editListingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const listingId = document.getElementById('editListingId').value;
    
    const formData = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        city: document.getElementById('editCity').value,
        area: document.getElementById('editArea').value,
        rent: document.getElementById('editRent').value,
        available_from: document.getElementById('editAvailableFrom').value,
        occupancy: document.getElementById('editOccupancy').value,
        furnished: document.getElementById('editFurnished').value === 'true',
        gender_preference: document.getElementById('editGenderPreference').value
    };
    
    try {
        const response = await fetch(`/api/listings/${listingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('Listing updated successfully!');
            modal.style.display = 'none';
            window.location.reload();
        } else {
            const error = await response.json();
            alert(error.error || 'Error updating listing');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating listing');
    }
});

// Load join requests for a listing
async function loadJoinRequests(listingId, container) {
    try {
        const response = await fetch(`/api/listings/${listingId}/requests`);
        if (!response.ok) throw new Error('Failed to load requests');
        
        const requests = await response.json();
        const requestsCount = requests.length;
        
        const countSpan = container.querySelector('.requests-count');
        if (countSpan) countSpan.textContent = requestsCount;
        
        const requestsList = container.querySelector('.requests-list');
        
        if (requests.length === 0) {
            requestsList.innerHTML = '<div class="no-requests">No pending requests</div>';
            return;
        }
        
        requestsList.innerHTML = requests.map(request => `
            <div class="request-item" data-request-id="${request.id}">
                <div class="request-info">
                    <div class="request-header">
                        ${request.profile_photo
                            ? `<img src="${request.profile_photo}" class="request-avatar" alt="${escapeHtml(request.sender_name)}">`
                            : `<div class="request-avatar-initial">${escapeHtml((request.sender_name || '?').charAt(0).toUpperCase())}</div>`
                        }
                        <div>
                            <div class="request-name">${escapeHtml(request.sender_name)}</div>
                            <div class="request-subtitle">
                                ${request.age ? `${request.age} yrs` : ''}${request.age && request.gender ? ' · ' : ''}${request.gender ? escapeHtml(request.gender) : ''}
                            </div>
                        </div>
                    </div>
                    ${request.college ? `<div class="request-details"><i class="fas fa-graduation-cap"></i> ${escapeHtml(request.college)}</div>` : ''}
                    ${request.profession ? `<div class="request-details"><i class="fas fa-briefcase"></i> ${escapeHtml(request.profession)}</div>` : ''}
                    ${request.message ? `<div class="request-details"><i class="fas fa-comment"></i> "${escapeHtml(request.message)}"</div>` : ''}
                </div>
                <div class="request-actions">
                    <button class="view-profile-btn" data-id="${request.id}" data-sender-id="${request.sender_id}">
                        <i class="fas fa-id-card"></i> View Profile
                    </button>
                    <button class="accept-request" data-id="${request.id}">Accept</button>
                    <button class="reject-request" data-id="${request.id}">Reject</button>
                </div>
            </div>
        `).join('');

        // Attach event listeners for view profile
        container.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => openProfileModal(
                btn.getAttribute('data-sender-id'),
                btn.getAttribute('data-id'),
                container
            ));
        });

        // Attach event listeners for accept/reject
        container.querySelectorAll('.accept-request').forEach(btn => {
            btn.addEventListener('click', () => handleRequestAction(btn.getAttribute('data-id'), 'accept', container));
        });
        
        container.querySelectorAll('.reject-request').forEach(btn => {
            btn.addEventListener('click', () => handleRequestAction(btn.getAttribute('data-id'), 'reject', container));
        });
        
    } catch (error) {
        console.error('Error loading requests:', error);
        const requestsList = container.querySelector('.requests-list');
        requestsList.innerHTML = '<div class="error-message">Error loading requests</div>';
    }
}

// View a requester's full profile before deciding on their join request
async function openProfileModal(senderId, requestId, container) {
    const modalBody = document.getElementById('profileModalBody');
    modalBody.innerHTML = '<div class="loading-requests">Loading profile...</div>';
    profileModal.style.display = 'block';

    try {
        const response = await fetch(`/api/users/${senderId}`);
        if (!response.ok) throw new Error('Failed to load profile');
        const p = await response.json();

        const avatarHtml = p.profile_photo
            ? `<img src="${p.profile_photo}" class="profile-modal-avatar" alt="${escapeHtml(p.full_name)}">`
            : `<div class="profile-modal-avatar-initial">${escapeHtml((p.full_name || '?').charAt(0).toUpperCase())}</div>`;

        const lifestyleBadges = [
            p.smoker ? '<span class="profile-badge">🚬 Smoker</span>' : '',
            p.pets_friendly ? '<span class="profile-badge">🐾 Pet-friendly</span>' : '',
            p.veg ? '<span class="profile-badge">🥦 Vegetarian</span>' : '',
            p.sleep_schedule ? `<span class="profile-badge">${formatEnum(p.sleep_schedule)}</span>` : '',
            p.cleanliness_level ? `<span class="profile-badge">${formatEnum(p.cleanliness_level)} cleanliness</span>` : ''
        ].filter(Boolean).join('');

        modalBody.innerHTML = `
            <div class="profile-modal-header">
                ${avatarHtml}
                <div>
                    <h2>${escapeHtml(p.full_name)}</h2>
                    <div class="profile-modal-subtitle">
                        ${p.age ? `${p.age} yrs` : ''}${p.age && p.gender ? ' · ' : ''}${p.gender ? escapeHtml(formatEnum(p.gender)) : ''}
                    </div>
                </div>
            </div>

            ${p.bio ? `<p class="profile-modal-bio">"${escapeHtml(p.bio)}"</p>` : ''}

            <div class="profile-detail-grid">
                ${p.college ? `<div class="profile-detail-item"><i class="fas fa-graduation-cap"></i> ${escapeHtml(p.college)}</div>` : ''}
                ${p.profession ? `<div class="profile-detail-item"><i class="fas fa-briefcase"></i> ${escapeHtml(p.profession)}</div>` : ''}
                ${p.city ? `<div class="profile-detail-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(p.city)}${p.area ? ', ' + escapeHtml(p.area) : ''}</div>` : ''}
                ${(p.budget_min || p.budget_max) ? `<div class="profile-detail-item"><i class="fas fa-rupee-sign"></i> Budget: ₹${p.budget_min || '?'} - ₹${p.budget_max || '?'}</div>` : ''}
            </div>

            ${lifestyleBadges ? `<div class="profile-badges">${lifestyleBadges}</div>` : ''}

            ${(!p.bio && !p.college && !p.profession && !p.city && !p.budget_min) ? '<p class="no-requests">This user hasn\'t filled in their profile yet.</p>' : ''}

            <div class="request-actions" style="margin-top: 20px;">
                <button class="accept-request" id="modalAcceptBtn">Accept</button>
                <button class="reject-request" id="modalRejectBtn">Reject</button>
            </div>
        `;

        document.getElementById('modalAcceptBtn').addEventListener('click', () => {
            profileModal.style.display = 'none';
            handleRequestAction(requestId, 'accept', container);
        });
        document.getElementById('modalRejectBtn').addEventListener('click', () => {
            profileModal.style.display = 'none';
            handleRequestAction(requestId, 'reject', container);
        });

    } catch (error) {
        console.error('Error loading profile:', error);
        modalBody.innerHTML = '<div class="error-message">Error loading profile</div>';
    }
}

// Turn 'early_bird' / 'very_clean' etc into readable text
function formatEnum(str) {
    if (!str) return '';
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Handle accept/reject
async function handleRequestAction(requestId, action, container) {
    try {
        const response = await fetch(`/api/join-requests/${requestId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            alert(`Request ${action}ed successfully!`);
            const listingId = container.closest('.my-listing-details').querySelector('.listing-item').getAttribute('data-id');
            loadJoinRequests(listingId, container);
            
            if (action === 'accept') {
                setTimeout(() => window.location.reload(), 1000);
            }
        } else {
            const error = await response.json();
            alert(error.error || `Error ${action}ing request`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Error ${action}ing request`);
    }
}

// Request to join saved listing
document.querySelectorAll('.request-join-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const listingId = btn.getAttribute('data-id');
        const message = prompt('Send a message to the owner (optional):');
        
        try {
            const response = await fetch(`/api/listings/${listingId}/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message || '' })
            });
            
            if (response.ok) {
                alert('Join request sent successfully!');
                btn.disabled = true;
                btn.textContent = 'Request Sent';
            } else {
                const error = await response.json();
                alert(error.error || 'Error sending request');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error sending request');
        }
    });
});

// Unsave listing
document.querySelectorAll('.unsave-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const listingId = btn.getAttribute('data-id');
        
        if (!confirm('Remove this listing from your saved list?')) return;
        
        try {
            const response = await fetch(`/api/saved/${listingId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                alert('Listing removed from saved');
                window.location.reload();
            } else {
                alert('Error removing listing');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error removing listing');
        }
    });
});
// Leave room
document.querySelectorAll('.leave-room-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const listingId = btn.getAttribute('data-listing-id');

        if (!confirm('Are you sure you want to leave this room? You can request to join other rooms after leaving.')) {
            return;
        }

        try {
            const response = await fetch(`/api/listings/${listingId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                alert('You have left the room.');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(error.error || 'Error leaving room');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error leaving room');
        }
    });
});
// Helper: escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Initialize join requests for each listing
document.querySelectorAll('.my-listing-details').forEach(container => {
    const listingItem = container.querySelector('.listing-item');
    if (listingItem) {
        const listingId = listingItem.getAttribute('data-id');
        loadJoinRequests(listingId, container);
    }
});
document.querySelectorAll('.send-request-btn').forEach(button => {
    button.addEventListener('click', async function () {
        const listingId = this.dataset.id;
        try {
            const response = await fetch(`/send-request/${listingId}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (response.ok) {
                this.outerHTML = `<span style="color:#f0a500;font-size:0.85rem">
                    <i class="fas fa-clock"></i> Pending
                </span>`;
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        }
    });
});