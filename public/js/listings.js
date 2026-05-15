// Search filter functionality
function filterListings() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.listing-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.listing-title').textContent.toLowerCase();
        const location = card.querySelector('.listing-location').textContent.toLowerCase();
        
        if (title.includes(searchInput) || location.includes(searchInput)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Image preview for forms
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}