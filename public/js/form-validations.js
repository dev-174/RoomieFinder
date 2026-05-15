// Validate listing form
document.getElementById('listingForm')?.addEventListener('submit', function(e) {
    const title = document.getElementById('title').value;
    const price = document.getElementById('price').value;
    const location = document.getElementById('location').value;
    
    if (!title || title.length < 3) {
        e.preventDefault();
        alert('Title must be at least 3 characters');
        return;
    }
    
    if (!price || price <= 0) {
        e.preventDefault();
        alert('Please enter a valid price');
        return;
    }
    
    if (!location) {
        e.preventDefault();
        alert('Please enter a location');
        return;
    }
});