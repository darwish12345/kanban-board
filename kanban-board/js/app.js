// Kanban Board Application
let boardData = {
    columns: []
};

let currentTaskLabels = [];
let dragEnabled = true;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBoardData();
    setupEventListeners();
    renderBoard();
    initializeDragAndDrop();
});

// Load board data from localStorage
function loadBoardData() {
    const saved = localStorage.getItem('kanbanBoard');
    if (saved) {
        boardData = JSON.parse(saved);
    } else {
        // Initialize with demo data
        boardData = getDemoBoard();
    }
}

// Demo board data
function getDemoBoard() {
    return {
        columns: [
            {
                id: 'col1',
                title: 'To Do',
                color: '#ef4444',
                tasks: [
                    {
                        id: 'task1',
                        title: 'Design Homepage',
                        description: 'Create wireframes and high-fidelity mockups',
                        priority: 'high',
                        dueDate: '2024-12-15',
                        labels: ['design']
                    },
                    {
                        id: 'task2',
                        title: 'Setup Database',
                        description: 'Design database schema for user data',
                        priority: 'medium',
                        dueDate: '2024-12-10',
                        labels: ['enhancement']
                    }
                ]
            },
            {
                id: 'col2',
                title: 'In Progress',
                color: '#f59e0b',
                tasks: [
                    {
                        id: 'task3',
                        title: 'API Integration',
                        description: 'Connect frontend to backend APIs',
                        priority: 'high',
                        dueDate: '2024-12-12',
                        labels: ['feature']
                    }
                ]
            },
            {
                id: 'col3',
                title: 'Review',
                color: '#8b5cf6',
                tasks: [
                    {
                        id: 'task4',
                        title: 'Code Review',
                        description: 'Review pull requests from team',
                        priority: 'medium',
                        dueDate: '2024-12-09',
                        labels: ['enhancement']
                    }
                ]
            },
            {
                id: 'col4',
                title: 'Done',
                color: '#10b981',
                tasks: [
                    {
                        id: 'task5',
                        title: 'Project Setup',
                        description: 'Initialize project structure and dependencies',
                        priority: 'low',
                        dueDate: '2024-12-01',
                        labels: ['documentation']
                    }
                ]
            }
        ]
    };
}

// Save board data
function saveBoardData() {
    localStorage.setItem('kanbanBoard', JSON.stringify(boardData));
}

// Setup event listeners
function setupEventListeners() {
    // Add column
    const addColumnBtn = document.getElementById('addColumnBtn');
    if (addColumnBtn) {
        addColumnBtn.addEventListener('click', () => {
            showAddColumnModal();
        });
    }
    
    // Create column
    const createColumnBtn = document.getElementById('createColumnBtn');
    if (createColumnBtn) {
        createColumnBtn.addEventListener('click', () => {
            createColumn();
        });
    }
    
    // Save task
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', () => {
            saveTask();
        });
    }
    
    // Update task
    const updateTaskBtn = document.getElementById('updateTaskBtn');
    if (updateTaskBtn) {
        updateTaskBtn.addEventListener('click', () => {
            updateTask();
        });
    }
    
    // Delete task
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    if (deleteTaskBtn) {
        deleteTaskBtn.addEventListener('click', () => {
            deleteTask();
        });
    }
    
    // Reset board
    const resetBoardBtn = document.getElementById('resetBoardBtn');
    if (resetBoardBtn) {
        resetBoardBtn.addEventListener('click', () => {
            if (confirm('Reset to demo board? All current data will be lost.')) {
                boardData = getDemoBoard();
                saveBoardData();
                renderBoard();
                initializeDragAndDrop();
            }
        });
    }
    
    // Export board
    const exportBoardBtn = document.getElementById('exportBoardBtn');
    if (exportBoardBtn) {
        exportBoardBtn.addEventListener('click', exportBoard);
    }
    
    // Import board
    const importBoardBtn = document.getElementById('importBoardBtn');
    if (importBoardBtn) {
        importBoardBtn.addEventListener('click', importBoard);
    }
    
    // Label selection
    document.querySelectorAll('.label-badge').forEach(label => {
        label.addEventListener('click', () => {
            label.classList.toggle('selected');
        });
    });
}

// Render board
function renderBoard() {
    const boardColumns = document.getElementById('boardColumns');
    if (!boardColumns) return;
    
    boardColumns.innerHTML = '';
    
    boardData.columns.forEach(column => {
        const columnElement = createColumnElement(column);
        boardColumns.appendChild(columnElement);
    });
}

// Create column element
function createColumnElement(column) {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'column';
    columnDiv.dataset.columnId = column.id;
    
    columnDiv.innerHTML = `
        <div class="column-header" style="border-bottom-color: ${column.color}">
            <div class="column-title">
                <span>${column.title}</span>
                <span class="task-count">${column.tasks.length}</span>
            </div>
            <div class="column-actions">
                <i class="fas fa-plus add-task-icon" title="Add Task"></i>
                <i class="fas fa-trash-alt delete-column-icon" title="Delete Column"></i>
            </div>
        </div>
        <div class="tasks-container" data-column-id="${column.id}">
            ${renderTasks(column.tasks)}
        </div>
        <button class="add-task-btn">
            <i class="fas fa-plus me-1"></i> Add Task
        </button>
    `;
    
    // Add event listeners
    const addTaskBtn = columnDiv.querySelector('.add-task-btn');
    const addTaskIcon = columnDiv.querySelector('.add-task-icon');
    const deleteColumnIcon = columnDiv.querySelector('.delete-column-icon');
    
    addTaskBtn.addEventListener('click', () => showAddTaskModal(column.id));
    addTaskIcon.addEventListener('click', () => showAddTaskModal(column.id));
    deleteColumnIcon.addEventListener('click', () => deleteColumn(column.id));
    
    return columnDiv;
}

// Render tasks
function renderTasks(tasks) {
    if (tasks.length === 0) {
        return '<div class="text-muted text-center p-3" style="font-size: 0.8rem;">No tasks yet</div>';
    }
    
    return tasks.map(task => `
        <div class="task-card" draggable="true" data-task-id="${task.id}" data-column-id="${task.columnId || ''}" style="border-left-color: ${getPriorityColor(task.priority)}">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <i class="fas fa-edit edit-task" data-task-id="${task.id}"></i>
                    <i class="fas fa-trash-alt delete-task" data-task-id="${task.id}"></i>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description.substring(0, 80))}${task.description.length > 80 ? '...' : ''}</div>` : ''}
            <div class="task-footer">
                <div class="task-priority priority-${task.priority}">
                    ${getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
                </div>
                ${task.dueDate ? `<div class="task-due-date"><i class="far fa-calendar-alt me-1"></i>${formatDate(task.dueDate)}</div>` : ''}
            </div>
            ${task.labels && task.labels.length > 0 ? `
                <div class="task-labels">
                    ${task.labels.map(label => `<span class="task-label label-${label}">${getLabelName(label)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getPriorityColor(priority) {
    const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
    return colors[priority] || '#94a3b8';
}

function getPriorityIcon(priority) {
    const icons = { high: '🔴', medium: '🟡', low: '🟢' };
    return icons[priority] || '⚪';
}

function getLabelName(label) {
    const names = {
        bug: '🐛 Bug',
        feature: '✨ Feature',
        enhancement: '🚀 Enhancement',
        documentation: '📚 Docs',
        design: '🎨 Design'
    };
    return names[label] || label;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Show add task modal
function showAddTaskModal(columnId) {
    document.getElementById('taskColumnId').value = columnId;
    document.getElementById('addTaskForm').reset();
    currentTaskLabels = [];
    document.getElementById('selectedLabels').innerHTML = '';
    document.querySelectorAll('.label-badge').forEach(label => {
        label.classList.remove('selected');
    });
    
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    modal.show();
}

// Save task
function saveTask() {
    const columnId = document.getElementById('taskColumnId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDesc').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    // Get selected labels
    const selectedLabels = [];
    document.querySelectorAll('.label-badge.selected').forEach(label => {
        selectedLabels.push(label.dataset.label);
    });
    
    const newTask = {
        id: 'task_' + Date.now(),
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate,
        labels: selectedLabels
    };
    
    const column = boardData.columns.find(col => col.id === columnId);
    if (column) {
        column.tasks.push(newTask);
        saveBoardData();
        renderBoard();
        initializeDragAndDrop();
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
    modal.hide();
}

// Show edit task modal
function showEditTaskModal(taskId, columnId) {
    const column = boardData.columns.find(col => col.id === columnId);
    const task = column.tasks.find(t => t.id === taskId);
    
    if (task) {
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editColumnId').value = columnId;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDesc').value = task.description || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskDueDate').value = task.dueDate || '';
        
        const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        modal.show();
    }
}

// Update task
function updateTask() {
    const taskId = document.getElementById('editTaskId').value;
    const columnId = document.getElementById('editColumnId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDesc').value;
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate = document.getElementById('editTaskDueDate').value;
    
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    const column = boardData.columns.find(col => col.id === columnId);
    const taskIndex = column.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        column.tasks[taskIndex] = {
            ...column.tasks[taskIndex],
            title: title,
            description: description,
            priority: priority,
            dueDate: dueDate
        };
        
        saveBoardData();
        renderBoard();
        initializeDragAndDrop();
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
    modal.hide();
}

// Delete task
function deleteTask() {
    if (!confirm('Delete this task?')) return;
    
    const taskId = document.getElementById('editTaskId').value;
    const columnId = document.getElementById('editColumnId').value;
    
    const column = boardData.columns.find(col => col.id === columnId);
    column.tasks = column.tasks.filter(t => t.id !== taskId);
    
    saveBoardData();
    renderBoard();
    initializeDragAndDrop();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
    modal.hide();
}

// Add column
function showAddColumnModal() {
    document.getElementById('newColumnTitle').value = '';
    const modal = new bootstrap.Modal(document.getElementById('addColumnModal'));
    modal.show();
}

function createColumn() {
    const title = document.getElementById('newColumnTitle').value.trim();
    const color = document.getElementById('newColumnColor').value;
    
    if (!title) {
        alert('Please enter a column title');
        return;
    }
    
    const newColumn = {
        id: 'col_' + Date.now(),
        title: title,
        color: color,
        tasks: []
    };
    
    boardData.columns.push(newColumn);
    saveBoardData();
    renderBoard();
    initializeDragAndDrop();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addColumnModal'));
    modal.hide();
}

// Delete column
function deleteColumn(columnId) {
    if (confirm('Delete this column and all its tasks?')) {
        boardData.columns = boardData.columns.filter(col => col.id !== columnId);
        saveBoardData();
        renderBoard();
        initializeDragAndDrop();
    }
}

// Initialize drag and drop
function initializeDragAndDrop() {
    const containers = document.querySelectorAll('.tasks-container');
    
    containers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.closest('.column').classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', () => {
            container.closest('.column').classList.remove('drag-over');
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.closest('.column').classList.remove('drag-over');
            
            const taskId = localStorage.getItem('draggedTaskId');
            const sourceColumnId = localStorage.getItem('sourceColumnId');
            const targetColumnId = container.dataset.columnId;
            
            if (taskId && sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
                moveTask(taskId, sourceColumnId, targetColumnId);
            }
            
            localStorage.removeItem('draggedTaskId');
            localStorage.removeItem('sourceColumnId');
        });
    });
    
    // Make tasks draggable
    document.querySelectorAll('.task-card').forEach(task => {
        task.setAttribute('draggable', 'true');
        
        task.addEventListener('dragstart', (e) => {
            const taskId = task.dataset.taskId;
            const columnId = task.closest('.tasks-container').dataset.columnId;
            localStorage.setItem('draggedTaskId', taskId);
            localStorage.setItem('sourceColumnId', columnId);
            task.classList.add('dragging');
        });
        
        task.addEventListener('dragend', (e) => {
            task.classList.remove('dragging');
        });
        
        // Edit and delete buttons
        const editBtn = task.querySelector('.edit-task');
        const deleteBtn = task.querySelector('.delete-task');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = editBtn.dataset.taskId;
                const columnId = task.closest('.tasks-container').dataset.columnId;
                showEditTaskModal(taskId, columnId);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this task?')) {
                    const taskId = deleteBtn.dataset.taskId;
                    const columnId = task.closest('.tasks-container').dataset.columnId;
                    const column = boardData.columns.find(col => col.id === columnId);
                    column.tasks = column.tasks.filter(t => t.id !== taskId);
                    saveBoardData();
                    renderBoard();
                    initializeDragAndDrop();
                }
            });
        }
    });
}

// Move task between columns
function moveTask(taskId, sourceColumnId, targetColumnId) {
    const sourceColumn = boardData.columns.find(col => col.id === sourceColumnId);
    const targetColumn = boardData.columns.find(col => col.id === targetColumnId);
    
    const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const task = sourceColumn.tasks[taskIndex];
        sourceColumn.tasks.splice(taskIndex, 1);
        targetColumn.tasks.push(task);
        
        saveBoardData();
        renderBoard();
        initializeDragAndDrop();
    }
}

// Export board
function exportBoard() {
    const dataStr = JSON.stringify(boardData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban_board_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Board exported successfully!', 'success');
}

// Import board
function importBoard() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.columns && Array.isArray(imported.columns)) {
                    boardData = imported;
                    saveBoardData();
                    renderBoard();
                    initializeDragAndDrop();
                    showToast('Board imported successfully!', 'success');
                } else {
                    showToast('Invalid file format', 'error');
                }
            } catch (error) {
                showToast('Error parsing file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
        ${message}
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);