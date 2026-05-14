const emojiHidden = document.getElementById('habit-emoji');
const emojiToggle = document.getElementById('emoji-toggle');
const pickerContainer = document.getElementById('picker');
const addForm = document.getElementById('add-form');
const habitNameInput = document.getElementById('habit-name');
const habitsList = document.getElementById('habits-list');
const calendarGrid = document.getElementById('calendar-grid');
const currentDateElement = document.getElementById('current-date');

const today = new Date();
let calendarMonth = new Date(today.getFullYear(), today.getMonth());
let habits = [];
let deletedHabits = [];
let completions = {};
let emojiPickerTarget = { mode: 'add', index: null };
let emojiPickerAnchor = null;
let mobileWeekStart = null;

const yearSelect = document.getElementById('year-select');
const prevWeekButton = document.getElementById('prev-week');
const nextWeekButton = document.getElementById('next-week');
const weekLabel = document.getElementById('week-label');
const monthSelect = document.getElementById('month-select');
const daySelect = document.getElementById('day-select');

const formatMonth = (month) => String(month).padStart(2, '0');
const formatDate = (year, month, day) => `${year}-${formatMonth(month)}-${String(day).padStart(2, '0')}`;
const getSelectedDate = () => currentDateElement?.dateTime || new Date().toISOString().slice(0, 10);

const dayOfWeekNames = ['日', '月', '火', '水', '木', '金', '土'];
const formatHumanDate = (date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${dayOfWeekNames[date.getDay()]}）`;

const updateCurrentDateElement = (date) => {
  if (!currentDateElement) return;
  currentDateElement.dateTime = formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  currentDateElement.textContent = formatHumanDate(date);
};

const updateCalendarTitle = (year, month) => {
  const heading = document.getElementById('calendar-heading');
  if (heading) {
    heading.textContent = `${year}年${month}月の習慣カレンダー`;
  }
};

const isMobileWeekView = () => window.matchMedia('(max-width: 700px)').matches;

const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const getWeekStart = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + mondayOffset);
  return result;
};

const getSelectedDateObj = () => {
  const values = getSelectedDate().split('-').map(Number);
  return new Date(values[0], values[1] - 1, values[2]);
};

const formatWeekLabel = (startDate) => {
  const endDate = addDays(startDate, 6);
  return `${startDate.getMonth() + 1}/${startDate.getDate()}〜${endDate.getMonth() + 1}/${endDate.getDate()}`;
};

const updateWeekLabel = () => {
  if (!weekLabel || !mobileWeekStart) return;
  weekLabel.textContent = formatWeekLabel(mobileWeekStart);
};

const renderWeekCalendar = () => {
  if (!calendarGrid) return;

  mobileWeekStart = mobileWeekStart || getWeekStart(getSelectedDateObj());
  const year = mobileWeekStart.getFullYear();
  const month = mobileWeekStart.getMonth() + 1;
  calendarGrid.innerHTML = '';

  for (let i = 0; i < 7; i += 1) {
    const currentDate = addDays(mobileWeekStart, i);
    const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());

    const cell = document.createElement('div');
    cell.className = 'calendar-cell';

    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day';
    dayHeader.textContent = `${currentDate.getMonth() + 1}/${currentDate.getDate()}（${dayOfWeekNames[currentDate.getDay()]}）`;

    const habitList = document.createElement('ul');
    habitList.className = 'calendar-habits';
    habitList.setAttribute('aria-label', `${currentDate.getDate()}日の習慣`);

    const completedHabits = completions[dateString] || [];
    completedHabits.forEach((habitName) => {
      const habit = habits.find((item) => item.name === habitName);
      if (!habit) return;

      const habitItem = document.createElement('li');
      habitItem.className = 'calendar-habit';

      const label = document.createElement('label');
      label.setAttribute('aria-label', `${dateString}: ${habit.name}`);

      const emojiSpan = document.createElement('span');
      emojiSpan.setAttribute('aria-hidden', 'true');
      emojiSpan.textContent = habit.emoji;

      const textSpan = document.createElement('span');
      textSpan.textContent = habit.name;

      label.append(emojiSpan, textSpan);
      habitItem.append(label);
      habitList.append(habitItem);
    });

    cell.append(dayHeader, habitList);
    bindCalendarCell(cell, currentDate);
    calendarGrid.append(cell);
  }

  updateWeekLabel();
  updateCalendarTitle(year, month);
  updateProgressBar(year, month);
};

const renderCalendar = () => {
  if (isMobileWeekView()) {
    renderWeekCalendar();
  } else {
    renderMonthCalendar();
  }
};

const calculateCompletionRate = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let completedDays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateString = formatDate(year, month, day);
    const completedHabits = completions[dateString] || [];
    if (completedHabits.length > 0) {
      completedDays += 1;
    }
  }

  return daysInMonth > 0 ? Math.round((completedDays / daysInMonth) * 100) : 0;
};

const updateProgressBar = (year, month) => {
  const rate = calculateCompletionRate(year, month);
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');

  if (fill) {
    fill.style.width = `${rate}%`;
  }
  if (text) {
    text.textContent = `${rate}%`;
  }
};

const populateYearSelect = (year) => {
  if (!yearSelect) return;
  yearSelect.innerHTML = '';

  const startYear = year - 5;
  const endYear = year + 5;

  for (let y = startYear; y <= endYear; y += 1) {
    const option = document.createElement('option');
    option.value = String(y);
    option.textContent = `${y}`;
    option.selected = y === calendarMonth.getFullYear();
    yearSelect.append(option);
  }
};

const populateMonthSelect = () => {
  if (!monthSelect) return;
  monthSelect.innerHTML = '';

  for (let month = 1; month <= 12; month += 1) {
    const option = document.createElement('option');
    option.value = String(month);
    option.textContent = `${month}`;
    option.selected = month === calendarMonth.getMonth() + 1;
    monthSelect.append(option);
  }
};

const populateDaySelect = (year, month, selectedDay = 1) => {
  if (!daySelect) return;
  const daysInMonth = new Date(year, month, 0).getDate();
  daySelect.innerHTML = '';

  for (let day = 1; day <= daysInMonth; day += 1) {
    const option = document.createElement('option');
    option.value = String(day);
    option.textContent = `${day}`;
    if (day === selectedDay) option.selected = true;
    daySelect.append(option);
  }
};

const selectDate = (date) => {
  calendarMonth = new Date(date.getFullYear(), date.getMonth());
  updateCurrentDateElement(date);

  if (yearSelect) {
    yearSelect.value = String(date.getFullYear());
  }

  if (monthSelect) {
    monthSelect.value = String(date.getMonth() + 1);
  }

  if (daySelect) {
    daySelect.value = String(date.getDate());
  }
};

const selectCalendarDate = (date) => {
  selectDate(date);
  if (isMobileWeekView()) {
    mobileWeekStart = getWeekStart(date);
  }
  renderHabitList();
  renderCalendar();
};

const bindCalendarCell = (cell, date) => {
  const dateString = formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const selectedDate = getSelectedDate();

  cell.dataset.date = dateString;
  cell.tabIndex = 0;
  cell.setAttribute('role', 'button');

  if (selectedDate === dateString) {
    cell.classList.add('selected');
  }

  const handleSelect = () => {
    selectCalendarDate(date);
  };

  cell.addEventListener('click', handleSelect);
  cell.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  });
};

const initializeDateControls = () => {
  const selectedDate = today;
  populateYearSelect(calendarMonth.getFullYear());
  populateMonthSelect();
  populateDaySelect(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, selectedDate.getDate());
  selectDate(selectedDate);
  updateCalendarTitle(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1);

  if (yearSelect) {
    yearSelect.addEventListener('change', () => {
      const selectedYear = Number(yearSelect.value);
      if (!Number.isFinite(selectedYear)) return;
      const selectedMonth = Number(monthSelect?.value) || calendarMonth.getMonth() + 1;
      calendarMonth = new Date(selectedYear, selectedMonth - 1);
      const selectedDay = Math.min(
        Number(daySelect?.value) || 1,
        new Date(selectedYear, calendarMonth.getMonth() + 1, 0).getDate()
      );
      populateDaySelect(selectedYear, calendarMonth.getMonth() + 1, selectedDay);
      const selectedDateObj = new Date(selectedYear, calendarMonth.getMonth(), selectedDay);
      selectDate(selectedDateObj);
      if (isMobileWeekView()) {
        mobileWeekStart = getWeekStart(selectedDateObj);
      }
      updateCalendarTitle(selectedYear, selectedMonth);
      renderHabitList();
      renderCalendar();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener('change', () => {
      const selectedMonth = Number(monthSelect.value);
      const selectedYear = Number(yearSelect?.value) || calendarMonth.getFullYear();
      if (!Number.isFinite(selectedMonth) || !Number.isFinite(selectedYear)) return;
      calendarMonth = new Date(selectedYear, selectedMonth - 1);
      const selectedDay = Math.min(
        Number(daySelect?.value) || 1,
        new Date(selectedYear, selectedMonth, 0).getDate()
      );
      populateDaySelect(selectedYear, selectedMonth, selectedDay);
      const selectedDateObj = new Date(selectedYear, selectedMonth - 1, selectedDay);
      selectDate(selectedDateObj);
      if (isMobileWeekView()) {
        mobileWeekStart = getWeekStart(selectedDateObj);
      }
      updateCalendarTitle(selectedYear, selectedMonth);
      renderHabitList();
      renderCalendar();
    });
  }

  if (daySelect) {
    daySelect.addEventListener('change', () => {
      const day = Number(daySelect.value);
      if (!Number.isFinite(day)) return;
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      selectDate(date);
      if (isMobileWeekView()) {
        mobileWeekStart = getWeekStart(getSelectedDateObj());
      }
      renderHabitList();
      renderCalendar();
    });
  }
};

const isHabitCompleted = (date, habitName) => {
  const completed = completions[date];
  return Array.isArray(completed) && completed.includes(habitName);
};

const storageKey = 'habitTrackerState';

const saveState = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ habits, completions }));
  } catch {
    // 保存に失敗しても処理を続行
  }
};

const loadState = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed.habits)) {
      habits = parsed.habits;
    }
    completions = parsed.completions || {};
    return true;
  } catch {
    return false;
  }
};

const setHabitCompletion = (date, habitName, completed) => {
  if (!completions[date]) {
    completions[date] = [];
  }

  const index = completions[date].indexOf(habitName);
  if (completed) {
    if (index === -1) {
      completions[date].push(habitName);
    }
  } else if (index !== -1) {
    completions[date].splice(index, 1);
  }

  saveState();
};

if (emojiHidden && !emojiHidden.value) {
  emojiHidden.value = emojiToggle?.textContent?.trim() || '😊';
}

function loadInitialHabits() {
  habits = Array.from(habitsList.querySelectorAll('article')).map((article) => {
    const emojiSpan = article.querySelector('span[aria-hidden="true"]');
    const nameSpan = article.querySelector('span:not([aria-hidden="true"])');
    return {
      emoji: emojiSpan?.textContent?.trim() || '😊',
      name: nameSpan?.textContent?.trim() || '習慣',
      editing: false,
    };
  });
}

const undoDeleteButton = document.getElementById('undo-delete-button');

function updateHabitStatus() {
  const status = document.querySelector('section[aria-labelledby="habits-heading"] p[role="status"]');
  if (!status) return;
  status.hidden = habits.length > 0;
}

function renderUndoButton() {
  if (!undoDeleteButton) return;
  undoDeleteButton.hidden = deletedHabits.length === 0;
}

function renderHabitList() {
  const selectedDate = getSelectedDate();
  habitsList.innerHTML = '';

  habits.forEach((habit, index) => {
    const li = document.createElement('li');
    const article = document.createElement('article');
    article.setAttribute('aria-label', `習慣: ${habit.name}`);
    article.className = 'habit-item';

    const emojiSpan = document.createElement('span');
    emojiSpan.setAttribute('aria-hidden', 'true');
    emojiSpan.textContent = habit.emoji;

    if (habit.editing) {
      const emojiButton = document.createElement('button');
      emojiButton.type = 'button';
      emojiButton.className = 'habit-emoji-button';
      emojiButton.dataset.action = 'edit-emoji';
      emojiButton.dataset.index = String(index);
      emojiButton.setAttribute('aria-label', `${habit.name} の絵文字を変更`);
      emojiButton.textContent = habit.emoji;

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'habit-edit-input';
      nameInput.value = habit.name;
      nameInput.maxLength = 20;
      nameInput.setAttribute('aria-label', `${habit.name} の名前を編集`);

      const actions = document.createElement('div');
      actions.className = 'habit-actions';

      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.dataset.action = 'save';
      saveButton.dataset.index = String(index);
      saveButton.textContent = '保存';

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.dataset.action = 'cancel';
      cancelButton.dataset.index = String(index);
      cancelButton.textContent = 'キャンセル';

      actions.append(saveButton, cancelButton);
      article.append(emojiButton, nameInput, actions);
    } else {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.action = 'toggle-completion';
      checkbox.dataset.habit = habit.name;
      checkbox.checked = isHabitCompleted(selectedDate, habit.name);
      checkbox.setAttribute('aria-label', `${selectedDate} に ${habit.name} を達成した`);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = habit.name;

      const actions = document.createElement('div');
      actions.className = 'habit-actions';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.dataset.action = 'edit';
      editButton.dataset.index = String(index);
      editButton.setAttribute('aria-label', `「${habit.name}」を編集`);
      editButton.textContent = '編集';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.index = String(index);
      deleteButton.setAttribute('aria-label', `「${habit.name}」を削除`);
      deleteButton.textContent = '削除';

      actions.append(editButton, deleteButton);
      const habitLabel = document.createElement('label');
      habitLabel.append(checkbox, emojiSpan, nameSpan);
      article.append(habitLabel, actions);
    }

    li.append(article);
    habitsList.append(li);
  });

  updateHabitStatus();
  renderUndoButton();
}

function renderMonthCalendar() {
  if (!calendarGrid) return;

  calendarGrid.innerHTML = '';
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth() + 1;
  const firstDate = new Date(year, month - 1, 1);
  const firstWeekday = (firstDate.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstWeekday; i += 1) {
    const placeholder = document.createElement('div');
    placeholder.className = 'calendar-cell empty';
    calendarGrid.append(placeholder);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';

    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day';
    dayHeader.textContent = day;

    const habitList = document.createElement('ul');
    habitList.className = 'calendar-habits';
    habitList.setAttribute('aria-label', `${day}日の習慣`);

    const dateString = formatDate(year, month, day);
    const completedHabits = completions[dateString] || [];

    completedHabits.forEach((habitName) => {
      const habit = habits.find((item) => item.name === habitName);
      if (!habit) return;

      const habitItem = document.createElement('li');
      habitItem.className = 'calendar-habit';

      const label = document.createElement('label');
      label.setAttribute('aria-label', `${dateString}: ${habit.name}`);

      const emojiSpan = document.createElement('span');
      emojiSpan.setAttribute('aria-hidden', 'true');
      emojiSpan.textContent = habit.emoji;

      const textSpan = document.createElement('span');
      textSpan.textContent = habit.name;

      label.append(emojiSpan, textSpan);
      habitItem.append(label);
      habitList.append(habitItem);
    });

    cell.append(dayHeader, habitList);
    bindCalendarCell(cell, new Date(year, month - 1, day));
    calendarGrid.append(cell);
  }

  updateProgressBar(year, month);
}

function initializeHabitHandlers() {
  habitsList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox || checkbox.dataset.action !== 'toggle-completion') return;

    const habitName = checkbox.dataset.habit;
    const selectedDate = getSelectedDate();
    setHabitCompletion(selectedDate, habitName, checkbox.checked);
    renderCalendar();
  });

  habitsList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    if (Number.isNaN(index)) return;

    if (action === 'delete') {
      const removed = habits.splice(index, 1)[0];
      deletedHabits.unshift({ habit: removed, index });
      Object.keys(completions).forEach((date) => {
        setHabitCompletion(date, removed.name, false);
      });
      renderHabitList();
      renderCalendar();
      return;
    }

    if (action === 'edit') {
      habits = habits.map((habit, idx) => ({
        ...habit,
        editing: idx === index,
      }));
      renderHabitList();
      return;
    }

    if (action === 'edit-emoji') {
      emojiPickerTarget = { mode: 'edit', index };
      pickerContainer.hidden = false;
      emojiToggle.setAttribute('aria-expanded', 'true');
      return;
    }

    if (action === 'save') {
      const article = button.closest('article');
      const input = article?.querySelector('.habit-edit-input');
      const newName = input?.value.trim();
      if (!newName) return;
      const oldName = habits[index].name;
      habits[index] = { ...habits[index], name: newName, editing: false };
      Object.keys(completions).forEach((date) => {
        const list = completions[date];
        if (!Array.isArray(list)) return;
        const itemIndex = list.indexOf(oldName);
        if (itemIndex !== -1) {
          list[itemIndex] = newName;
        }
      });
      saveState();
      renderHabitList();
      renderCalendar();
      return;
    }

    if (action === 'cancel') {
      habits[index] = { ...habits[index], editing: false };
      renderHabitList();
      return;
    }
  });

  if (undoDeleteButton) {
    undoDeleteButton.addEventListener('click', () => {
      const removed = deletedHabits.shift();
      if (!removed) return;
      const index = Math.min(removed.index, habits.length);
      habits.splice(index, 0, removed.habit);
      saveState();
      renderHabitList();
      renderCalendar();
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = habitNameInput?.value.trim();
      let emoji = emojiHidden?.value.trim();
      if (!emoji && emojiToggle) {
        emoji = emojiToggle.textContent.trim() || '😊';
      }
      if (!name || !emoji) return;

      habits.push({ name, emoji, editing: false });
      habitNameInput.value = '';
      emojiHidden.value = '😊';
      emojiToggle.textContent = '😊';
      deletedHabits = [];
      saveState();

      renderHabitList();
      renderCalendar();
    });
  }
}

if (emojiHidden && emojiToggle && pickerContainer && window.EmojiMart) {
  const picker = new EmojiMart.Picker({
    locale: 'ja',
    onEmojiSelect: (emoji) => {
      if (emojiPickerTarget.mode === 'edit' && emojiPickerTarget.index !== null) {
        habits[emojiPickerTarget.index] = {
          ...habits[emojiPickerTarget.index],
          emoji: emoji.native,
          editing: true,
        };
        renderHabitList();
      } else {
        emojiToggle.textContent = emoji.native;
        emojiHidden.value = emoji.native;
      }
      pickerContainer.hidden = true;
      emojiToggle.setAttribute('aria-expanded', 'false');
      emojiPickerTarget = { mode: 'add', index: null };
      emojiToggle.focus();
    },
  });

  pickerContainer.appendChild(picker);

  const positionPicker = (anchor) => {
    if (!anchor || !pickerContainer) return;
    const rect = anchor.getBoundingClientRect();
    pickerContainer.style.position = 'fixed';
    pickerContainer.style.left = `${Math.max(8, rect.left)}px`;
    pickerContainer.style.top = `${rect.bottom + 8}px`;
  };

  const openPicker = (anchor, mode = 'add') => {
    emojiPickerTarget = { mode, index: mode === 'edit' ? Number(anchor.dataset.index) : null };
    emojiPickerAnchor = anchor;
    positionPicker(anchor);
    pickerContainer.hidden = false;
    emojiToggle.setAttribute('aria-expanded', mode === 'add' ? 'true' : 'false');
  };

  const togglePicker = () => {
    if (pickerContainer.hidden) {
      openPicker(emojiToggle, 'add');
    } else {
      pickerContainer.hidden = true;
      emojiToggle.setAttribute('aria-expanded', 'false');
    }
  };

  emojiToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePicker();
  });

  document.addEventListener('click', (event) => {
    const clickedEditEmoji = event.target.closest('button[data-action="edit-emoji"]');
    if (!pickerContainer.contains(event.target) && event.target !== emojiToggle && !clickedEditEmoji) {
      pickerContainer.hidden = true;
      emojiToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

initializeDateControls();

const moveMobileWeek = (days) => {
  if (!isMobileWeekView()) return;
  const current = getSelectedDateObj();
  const target = addDays(current, days);
  calendarMonth = new Date(target.getFullYear(), target.getMonth());
  selectDate(target);
  mobileWeekStart = getWeekStart(target);
  renderHabitList();
  renderCalendar();
};

const initializeWeekNavigation = () => {
  mobileWeekStart = getWeekStart(getSelectedDateObj());
  updateWeekLabel();

  if (prevWeekButton) {
    prevWeekButton.addEventListener('click', () => moveMobileWeek(-7));
  }

  if (nextWeekButton) {
    nextWeekButton.addEventListener('click', () => moveMobileWeek(7));
  }

  window.addEventListener('resize', () => {
    const selected = getSelectedDateObj();
    mobileWeekStart = getWeekStart(selected);
    renderCalendar();
  });
};

initializeWeekNavigation();

if (!loadState()) {
  loadInitialHabits();
}
renderHabitList();
renderCalendar();
initializeHabitHandlers();
