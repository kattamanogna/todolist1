const addbtn = document.querySelector(".add-item-btn");
const overlay = document.querySelector(".overlay");
const closeicon = document.getElementById("close-icon");
const itemForm = document.querySelector(".item-form");
const itemCtn = document.getElementById("item-container");
const greeting = document.getElementById("user-greeting");
const logoutBtn = document.getElementById("logout-btn");

let editingTaskId = null;

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

const API = window.API_BASE_URL;

if (!userId) window.location.href = "login.html";
if (greeting) greeting.textContent = `Welcome ${username}, this is your personalized To-Do List`;

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

function openFormHandler() {
  overlay.classList.remove("hidden");
}

function close() {
  overlay.classList.add("hidden");
  editingTaskId = null;
  itemForm.reset();
}

function createTaskElement(task) {
  const item = document.createElement("div");
  item.classList.add("item");

  const itemTitle = document.createElement("h2");
  itemTitle.classList.add("title");
  itemTitle.innerText = task.title;

  const itemDesc = document.createElement("p");
  itemDesc.classList.add("desc");
  itemDesc.innerText = task.description;

  const date = document.createElement("div");
  date.classList.add("date-ctn");

  const startDate = document.createElement("h3");
  startDate.innerText = `Start: ${new Date(task.startDate).toLocaleDateString()}`;
  const endDate = document.createElement("h3");
  endDate.innerText = `Due: ${new Date(task.endDate).toLocaleDateString()}`;
  date.append(startDate, endDate);

  const priority = document.createElement("span");
  priority.classList.add("priority", task.priority.toLowerCase());
  priority.innerText = task.priority + " Priority";

  const checklist = document.createElement("ul");
  task.subtasks.forEach((sub, i) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = sub.completed;
    checkbox.addEventListener("change", async () => {
      await fetch(`${API}/api/tasks/${task._id}/subtasks/${i}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: checkbox.checked }),
      });
      li.style.textDecoration = checkbox.checked ? "line-through" : "none";
    });
    li.append(checkbox, ` ${sub.title}`);
    li.style.textDecoration = sub.completed ? "line-through" : "none";
    checklist.appendChild(li);
  });

  const utibtnctn = document.createElement("div");
  utibtnctn.classList.add("utility");

  const disbtn = document.createElement("button");
  disbtn.innerText = "Discard";
  disbtn.className = "btn discard-btn";
  disbtn.onclick = async () => {
    await fetch(`${API}/api/tasks/${task._id}`, { method: "DELETE" });
    item.remove();
  };

  const combtn = document.createElement("button");
  combtn.innerText = "Complete";
  combtn.className = "btn complete-btn";
  combtn.onclick = async () => {
    await fetch(`${API}/api/tasks/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    item.style.opacity = "0.5";
  };

  const editbtn = document.createElement("button");
  editbtn.innerText = "Edit";
  editbtn.className = "btn edit-btn";
  editbtn.onclick = () => {
    editingTaskId = task._id;
    itemForm.querySelector(".item-title").value = task.title;
    itemForm.querySelector(".item-desc").value = task.description;
    itemForm.querySelector(".item-start-date").value = task.startDate.split("T")[0];
    itemForm.querySelector(".item-due-date").value = task.endDate.split("T")[0];
    itemForm.querySelector(".item-priority").value = task.priority;
    itemForm.querySelector(".item-subtasks").value = task.subtasks.map(s => s.title).join("\n");

    overlay.classList.remove("hidden");
  };

  utibtnctn.append(disbtn, combtn, editbtn);
  item.append(itemTitle, itemDesc, priority, date, checklist, utibtnctn);
  itemCtn.appendChild(item);
}

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = itemForm.querySelector(".item-title").value;
  const description = itemForm.querySelector(".item-desc").value;
  const startDate = itemForm.querySelector(".item-start-date").value;
  const endDate = itemForm.querySelector(".item-due-date").value;
  const priority = itemForm.querySelector(".item-priority").value;
  const subtasks = itemForm.querySelector(".item-subtasks").value
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(t => ({ title: t, completed: false }));

  const taskPayload = { title, description, startDate, endDate, priority, subtasks, userId };

  let url = `${API}/api/tasks`;
  let method = "POST";

  if (editingTaskId) {
    url = `${API}/api/tasks/${editingTaskId}`;
    method = "PUT";
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskPayload)
  });

  if (res.ok) {
    overlay.classList.add("hidden");
    itemForm.reset();
    editingTaskId = null;
    itemCtn.innerHTML = "";
    const updatedTasks = await fetch(`${API}/api/tasks/${userId}`);
    const tasks = await updatedTasks.json();
    tasks.forEach(createTaskElement);
  } else {
    alert("Failed to save task.");
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`${API}/api/tasks/${userId}`);
  const tasks = await res.json();
  tasks.forEach(createTaskElement);
});

addbtn.addEventListener("click", openFormHandler);
closeicon.addEventListener("click", close);
//