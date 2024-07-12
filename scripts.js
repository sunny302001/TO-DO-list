const apiUrl = 'http://localhost:5000/api/tasks';

let selectedPriority = 'medium'; // Default priority

let selectedTaskDate = new Date(); // Default to today

document.getElementById('add-task-button').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addTask();
    }
});

document.getElementById('today').addEventListener('click', (e) => {
    selectedTaskDate = new Date();
    document.getElementById('selected-date-label').innerText = "Today";
});
document.getElementById('tomorrow').addEventListener('click', (e) => {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    selectedTaskDate = tomorrow;
    document.getElementById('selected-date-label').innerText = "Tomorrow";
});
document.getElementById('weekend').addEventListener('click', (e) => {
    let weekend = new Date();
    let day = weekend.getDay();
    let daysUntilWeekend = (day === 0) ? 6 : 6 - day;
    weekend.setDate(weekend.getDate() + daysUntilWeekend);
    selectedTaskDate = weekend;
    document.getElementById('selected-date-label').innerText = "Weekend";
});

// document.getElementById('priority-filter').addEventListener('change', function() {
//     const selectedPriority = this.value;
//     filterTasksByPriority(selectedPriority);
// });

document.getElementById('task-list').addEventListener('click', function(e) {
    if (e.target.classList.contains('del-task-button')) {
        const listItem = e.target.closest('li');
        const taskId = listItem.getAttribute('data-id');
        fetch(`${apiUrl}/${taskId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.message === 'Task deleted') {
                listItem.remove();
            } else {
                console.error('Error deleting task:', result.message);
            }
        })
        .catch(error => console.error('Error:', error));
    } else if (e.target.classList.contains('edit-task-button') || e.target.parentElement.classList.contains('edit-task-button')) {
        const listItem = e.target.closest('li');
        const taskId = listItem.getAttribute('data-id');
        openEditSidebar(taskId);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetch(apiUrl)
        .then(response => response.json())
        .then(tasks => {
            tasks.forEach(task => displayTask(task));
        })
        .catch(error => console.error('Error fetching tasks:', error));
});

document.getElementById('close-edit-sidebar').addEventListener('click', () => {
    document.getElementById('edit-sidebar').classList.remove('open');
});

document.getElementById('edit-task-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const taskId = this.getAttribute('data-id');
    const updatedTask = {
        text: document.getElementById('edit-task-text').value.trim(),
        date: new Date(document.getElementById('edit-task-date').value).toISOString(),
        priority: document.getElementById('edit-task-priority').value,
        tags: document.getElementById('edit-task-tags').value.split(',').map(tag => tag.trim()),
        description: document.getElementById('edit-task-desc').value.trim()
    };

    fetch(`${apiUrl}/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
    })
    .then(response => response.json())
    .then(task => {
        document.getElementById('edit-sidebar').classList.remove('open');
        updateTaskInList(task);
    })
    .catch(error => console.error('Error updating task:', error));
});

document.getElementById('high-priority').addEventListener('click', (e) => {
    selectedPriority = 'high';
    document.getElementById('selected-priority-label').innerText = "High";
    document.getElementById('selected-priority-label').style.color = "red";
});

document.getElementById('medium-priority').addEventListener('click', (e) => {
    selectedPriority = 'medium';
    document.getElementById('selected-priority-label').innerText = "Medium";
    document.getElementById('selected-priority-label').style.color = "blue";
});

document.getElementById('low-priority').addEventListener('click', (e) => {
    selectedPriority = 'low';
    document.getElementById('selected-priority-label').innerText = "Low";
    document.getElementById('selected-priority-label').style.color = "green";
});

document.addEventListener('DOMContentLoaded', () => {
    fetch(apiUrl)
        .then(response => response.json())
        .then(tasks => {
            updateTaskCounts(tasks);  // Update the counts after fetching tasks
        })
        .catch(error => console.error('Error fetching tasks:', error));
});

function filterTasksByPriority(priority) {
    const tasks = document.querySelectorAll('#task-list .list-group-item');
    tasks.forEach(task => {
        const taskPriority = task.getAttribute('data-priority');
        if (priority === 'all' || taskPriority === priority) {
            task.style.display = 'flex';
        } else {
            task.style.display = 'none';
        }
    });
}


function addTask() {
    const todoInput = document.getElementById('task-input');
    const todoText = todoInput.value.trim();
    const tagsInput = document.getElementById('tag-input');
    const tags = tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()) : [];

    if (todoText) {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: todoText, priority: selectedPriority, date: selectedTaskDate, tags: tags })
        })
        .then(response => response.json())
        .then(task => {
            displayTask(task);
            todoInput.value = '';
            if (tagsInput) tagsInput.value = ''; // Clear the tags input
            fetchTasksAndUpdateCounts(); // Fetch tasks and update counts
        })
        .catch(error => console.error('Error adding task:', error));
    }
}

function displayTask(task) {
    const todoList = document.getElementById('task-list');
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
    listItem.setAttribute('data-id', task._id);
    listItem.setAttribute('data-priority', task.priority);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input me-2';
    checkbox.checked = task.completed;

    checkbox.addEventListener('change', () => {
        fetch(`${apiUrl}/${task._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: checkbox.checked })
        })
        .then(response => response.json())
        .then(updatedTask => {
            listItem.classList.toggle('completed', updatedTask.completed);
        })
        .catch(error => console.error('Error updating task:', error));
    });

    listItem.appendChild(checkbox);

    let dateLabel;
    const today = new Date();
    const taskDate = new Date(task.date);
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let weekend = new Date();
    let day = weekend.getDay();
    let daysUntilWeekend = (day === 0) ? 6 : 6 - day;
    weekend.setDate(weekend.getDate() + daysUntilWeekend);

    if (isSameDate(taskDate, today)) {
        dateLabel = 'Today';
    } else if (isSameDate(taskDate, tomorrow)) {
        dateLabel = 'Tomorrow';
    } else if (taskDate.getDay() === 6 || taskDate.getDay() === 0) {
        dateLabel = 'Weekend';
    } else {
        dateLabel = taskDate.toDateString();
    }

    listItem.innerHTML += `
        <span class="task-text">${task.text} (${dateLabel})</span>
    `;

    const tagsSpan = document.createElement('span');
    tagsSpan.className = 'badge bg-secondary me-2';
    tagsSpan.textContent = task.tags.join(', ');
    listItem.appendChild(tagsSpan);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.innerHTML = `
        <button type="button" class="btn btn-outline-primary edit-task-button"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn btn-outline-danger del-task-button">-</button>
    `;
    listItem.appendChild(buttonsDiv);

    // Set the priority color
    let priorityColor;
    switch (task.priority) {
        case 'high':
            priorityColor = 'red';
            break;
        case 'medium':
            priorityColor = 'blue';
            break;
        case 'low':
            priorityColor = 'green';
            break;
    }
    listItem.style.color = priorityColor;

    todoList.appendChild(listItem);
}



function isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function openEditSidebar(taskId) {
    fetch(`${apiUrl}/${taskId}`)
        .then(response => response.json())
        .then(task => {
            document.getElementById('edit-task-text').value = task.text;
            document.getElementById('edit-task-date').value = new Date(task.date).toISOString().split('T')[0];
            document.getElementById('edit-task-priority').value = task.priority;
            document.getElementById('edit-task-tags').value = task.tags.join(', ');
            document.getElementById('edit-task-desc').value = task.description || '';

            const editForm = document.getElementById('edit-task-form');
            editForm.setAttribute('data-id', task._id);

            document.getElementById('edit-sidebar').classList.add('open');
        })
        .catch(error => console.error('Error fetching task:', error));
}

function updateTaskInList(updatedTask) {
    const taskItem = document.querySelector(`#task-list [data-id='${updatedTask._id}']`);
    if (taskItem) {
        let dateLabel;
        const taskDate = new Date(updatedTask.date);
        const today = new Date();
        if (isSameDate(taskDate, today)) {
            dateLabel = 'Today';
        } else if (isSameDate(taskDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))) {
            dateLabel = 'Tomorrow';
        } else if (taskDate.getDay() === 6 || taskDate.getDay() === 0) {
            dateLabel = 'Weekend';
        } else {
            dateLabel = taskDate.toDateString();
        }

        taskItem.querySelector('.task-text').textContent = `${updatedTask.text} (${dateLabel})`;
        taskItem.setAttribute('data-priority', updatedTask.priority);
        taskItem.querySelector('.badge').textContent = updatedTask.tags.join(', ');
    }
}

function updateTaskCounts(tasks) {
    const todayCount = tasks.filter(task => isSameDate(new Date(task.date), new Date())).length;
    const tomorrowCount = tasks.filter(task => isSameDate(new Date(task.date), new Date(new Date().setDate(new Date().getDate() + 1)))).length;
    const weekendCount = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getDay() === 6 || taskDate.getDay() === 0;
    }).length;
    
    const highCount = tasks.filter(task => task.priority === 'high').length;
    const mediumCount = tasks.filter(task => task.priority === 'medium').length;
    const lowCount = tasks.filter(task => task.priority === 'low').length;

    document.getElementById('today-count').innerText = todayCount;
    document.getElementById('tomorrow-count').innerText = tomorrowCount;
    document.getElementById('weekend-count').innerText = weekendCount;
    document.getElementById('high-count').innerText = highCount;
    document.getElementById('medium-count').innerText = mediumCount;
    document.getElementById('low-count').innerText = lowCount;
}

function fetchTasksAndUpdateCounts() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(tasks => {
            updateTaskCounts(tasks);
            updateTagCounts(tasks);   // Update the tag counts after fetching tasks
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

function updateTagCounts(tasks) {
    const tagCounts = tasks.reduce((counts, task) => {
        task.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
        return counts;
    }, {});

    const tagsList = document.getElementById('tags-list');
    tagsList.innerHTML = ''; // Clear existing tags

    Object.keys(tagCounts).forEach(tag => {
        const tagItem = document.createElement('li');
        tagItem.className = 'list-group-item';
        tagItem.innerHTML = `#${tag} <span class="badge bg-primary rounded-pill">${tagCounts[tag]}</span>`;
        tagsList.appendChild(tagItem);
    });
}

function fetchTasksAndUpdateCounts() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(tasks => {
            updateTaskCounts(tasks);
            updateTagCounts(tasks); // Update tag counts whenever tasks are fetched
        })
        .catch(error => console.error('Error fetching tasks:', error));
}