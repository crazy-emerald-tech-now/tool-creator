// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // Get the button and the text area elements from the HTML
    const startButton = document.getElementById('start-button');
    const userInput = document.getElementById('userInput');

    // Add a 'click' event listener to the button
    startButton.addEventListener('click', () => {
        // Get the text (the "prompt") from the user's input
        const userPrompt = userInput.value;

        // Check if the user has entered anything
        if (userPrompt.trim() === '') {
            alert('Please describe the tool you want to build.');
            return; // Stop the function if the input is empty
        }

        // Save the user's prompt to the browser's local storage
        // The key is 'userPrompt' and the value is the text itself
        localStorage.setItem('userPrompt', userPrompt);

        // Redirect the user to the start.html page
        window.location.href = 'start.html';
    });
});
