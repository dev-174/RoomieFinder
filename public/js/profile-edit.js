// Profile Edit Page JavaScript

const avatarUploadZone = document.getElementById('avatarUploadZone');
const avatarInput = document.getElementById('avatarInput');
const avatarPreviewImg = document.getElementById('avatarPreviewImg');
const avatarPreviewInitial = document.getElementById('avatarPreviewInitial');

avatarUploadZone.addEventListener('click', () => avatarInput.click());

avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        avatarInput.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        avatarInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        avatarPreviewImg.src = e.target.result;
        avatarPreviewImg.style.display = 'block';
        if (avatarPreviewInitial) avatarPreviewInitial.style.display = 'none';
    };
    reader.readAsDataURL(file);
});

// Bio character counter
const bioField = document.getElementById('bio');
const bioCount = document.getElementById('bioCount');

function updateBioCount() {
    bioCount.textContent = bioField.value.length;
}
bioField.addEventListener('input', updateBioCount);
updateBioCount();

// Form submission
const profileForm = document.getElementById('profileForm');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(profileForm);

    // Checkboxes don't submit a value when unchecked, so set these explicitly
    // as 'true'/'false' rather than relying on native form serialization.
    formData.set('smoker', document.getElementById('smoker').checked ? 'true' : 'false');
    formData.set('pets_friendly', document.getElementById('petsFriendly').checked ? 'true' : 'false');
    formData.set('veg', document.getElementById('veg').checked ? 'true' : 'false');
    formData.set('looking_for_roommate', document.getElementById('lookingForRoommate').checked ? 'true' : 'false');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    saveStatus.textContent = '';
    saveStatus.className = 'save-status';

    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            saveStatus.textContent = 'Profile saved!';
            saveStatus.className = 'save-status success';
            setTimeout(() => window.location.href = '/dashboard', 700);
        } else {
            saveStatus.textContent = data.error || 'Error saving profile';
            saveStatus.className = 'save-status error';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Profile →';
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        saveStatus.textContent = 'Something went wrong. Please try again.';
        saveStatus.className = 'save-status error';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Profile →';
    }
});
