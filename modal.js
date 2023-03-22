// Get buttons and modals using data attributes
const buttons = document.querySelectorAll('[data-modal]');
const modals = document.querySelectorAll('.modal');

// Function to open a specific modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

// Function to close a specific modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Add click event listeners to the buttons
buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const modalId = button.getAttribute('data-modal');
    openModal(modalId);
  });
});

// Add click event listeners to the close elements
modals.forEach((modal) => {
  const closeElement = modal.querySelector('.close');
  if (closeElement) {
    closeElement.addEventListener('click', () => {
      closeModal(modal.id);
    });
  }
});

// Close the modal when clicking outside the modal content
window.addEventListener('click', (event) => {
  modals.forEach((modal) => {
    if (event.target === modal) {
        closeModal(modal.id);
    }
  });
});
