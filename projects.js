document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.getElementById('projects-grid');
    
    // Load projects from local storage
    const projects = JSON.parse(localStorage.getItem('toolCreatorProjects')) || [];

    if (projects.length === 0) {
        projectsGrid.innerHTML = '<p>You have not saved any projects yet. Create a tool and click "Save" to see it here!</p>';
        return;
    }

    // Reverse the array to show the newest projects first
    projects.reverse();

    projectsGrid.innerHTML = ''; // Clear any placeholder content

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.projectId = project.id; // Store the ID on the element

        const date = new Date(project.id).toLocaleDateString();

        card.innerHTML = `
            <div class="project-preview">
                <iframe srcdoc="${project.code}" scrolling="no"></iframe>
            </div>
            <div class="project-info">
                <h3>${project.prompt.substring(0, 40) + (project.prompt.length > 40 ? '...' : '')}</h3>
                <p>Saved on: ${date}</p>
            </div>
        `;
        
        // Add a click listener to load this project
        card.addEventListener('click', () => {
            // Store the ID of the project we want to load
            localStorage.setItem('loadProjectId', project.id);
            // Redirect to the editor page
            window.location.href = 'start.html';
        });

        projectsGrid.appendChild(card);
    });
});
