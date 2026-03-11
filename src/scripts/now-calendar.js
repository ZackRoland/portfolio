const currentYear = new Date().getFullYear();

const highlightedEvents = [
    {
        date: `${currentYear}-03-05`,
        title: 'Publish /now monthly format'
    },
    {
        date: `${currentYear}-03-12`,
        title: 'Portfolio feature planning'
    },
    {
        date: `${currentYear}-03-21`,
        title: 'Spring progress review'
    },
    {
        date: `${currentYear}-04-04`,
        title: 'April goals kickoff'
    }
];

const monthLabel = document.querySelector('#calendar-month');
const calendarGrid = document.querySelector('#calendar-grid');
const eventList = document.querySelector('#event-list');
const prevMonthButton = document.querySelector('#prev-month');
const nextMonthButton = document.querySelector('#next-month');

if (monthLabel && calendarGrid && eventList && prevMonthButton && nextMonthButton) {
    const today = new Date();
    const firstMonthOfYear = new Date(today.getFullYear(), 0, 1);
    let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const eventMap = new Map(highlightedEvents.map((event) => [event.date, event.title]));

    const updatePreviousButtonState = () => {
        const onMinimumMonth =
            visibleMonth.getFullYear() === firstMonthOfYear.getFullYear() &&
            visibleMonth.getMonth() === firstMonthOfYear.getMonth();

        prevMonthButton.disabled = onMinimumMonth;
        prevMonthButton.setAttribute('aria-disabled', String(onMinimumMonth));
    };

    const renderCalendar = () => {
        calendarGrid.innerHTML = '';

        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();

        monthLabel.textContent = visibleMonth.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric'
        });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPreviousMonth = new Date(year, month, 0).getDate();

        for (let index = 0; index < 42; index += 1) {
            const dayButton = document.createElement('button');
            dayButton.type = 'button';
            dayButton.className = 'calendar-day';
            dayButton.setAttribute('role', 'gridcell');

            let dayNumber;
            let dayDate;

            if (index < firstDayIndex) {
                dayNumber = daysInPreviousMonth - (firstDayIndex - index - 1);
                dayDate = new Date(year, month - 1, dayNumber);
                dayButton.classList.add('calendar-day--muted');
            } else if (index >= firstDayIndex + daysInMonth) {
                dayNumber = index - (firstDayIndex + daysInMonth) + 1;
                dayDate = new Date(year, month + 1, dayNumber);
                dayButton.classList.add('calendar-day--muted');
            } else {
                dayNumber = index - firstDayIndex + 1;
                dayDate = new Date(year, month, dayNumber);
            }

            const isoDate = dayDate.toISOString().slice(0, 10);
            const eventTitle = eventMap.get(isoDate);

            dayButton.innerHTML = `<span>${dayNumber}</span>`;

            if (eventTitle) {
                dayButton.classList.add('calendar-day--event');
                dayButton.innerHTML += `<small class="calendar-day__event-name">${eventTitle}</small>`;
            }

            if (dayDate.toDateString() === today.toDateString()) {
                dayButton.classList.add('calendar-day--today');
            }

            dayButton.setAttribute('aria-label', dayDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }) + (eventTitle ? `. ${eventTitle}` : ''));

            calendarGrid.appendChild(dayButton);
        }

        const visibleMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        const visibleEvents = highlightedEvents.filter((event) => event.date.startsWith(visibleMonthPrefix));

        eventList.innerHTML = '';
        if (visibleEvents.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'No highlighted events this month yet.';
            eventList.appendChild(emptyItem);
        } else {
            visibleEvents.forEach((event) => {
                const listItem = document.createElement('li');
                const formattedDate = new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                });
                listItem.textContent = `${formattedDate} — ${event.title}`;
                eventList.appendChild(listItem);
            });
        }

        updatePreviousButtonState();
    };

    prevMonthButton.addEventListener('click', () => {
        if (prevMonthButton.disabled) {
            return;
        }

        visibleMonth.setMonth(visibleMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        visibleMonth.setMonth(visibleMonth.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
}