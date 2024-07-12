const apiUrl = 'http://localhost:5000/api/tasks';

document.getElementById('add-task-button').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addTask();
    }
});

let selectedTaskDate = new Date(); // Default to today

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

document.getElementById('priority-filter').addEventListener('change', function() {
    const selectedPriority = this.value;
    filterTasksByPriority(selectedPriority);
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
    const priority = 'medium'; // Example priority
    const tags = document.getElementById('tag-input').value.split(',').map(tag => tag.trim());

    if (todoText) {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: todoText, priority: priority, date: selectedTaskDate, tags: tags })
        })
        .then(response => response.json())
        .then(task => {
            displayTask(task);
            todoInput.value = '';
            document.getElementById('tag-input').value = ''; // Clear the tags input
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
        <div>
            <button type="button" class="btn btn-outline-primary edit-task-button"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger del-task-button">-</button>
        </div>
    `;

    const tagsSpan = document.createElement('span');
    tagsSpan.className = 'badge bg-secondary';
    tagsSpan.textContent = task.tags.join(', ');
    listItem.appendChild(tagsSpan);

    todoList.appendChild(listItem);
}

function isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

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
