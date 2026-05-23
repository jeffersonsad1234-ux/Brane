import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function buildMockEvents() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const evts = [];
  const titles = [
    "Team standup", "Client call", "BRANPY sync",
    "Content review", "Affiliate check-in", "Lunch w/ team",
    "Sprint planning", "Design handoff", "Code review",
  ];
  for (let i = 0; i < 10; i++) {
    const day = (i * 3 + 1) % 28 + 1;
    const d = new Date(y, m, day, 10 + (i % 8), (i * 13) % 60);
    evts.push({
      id: `mock-${i}`,
      title: titles[i % titles.length],
      date: new Date(y, m, day).toDateString(),
      time: d.toTimeString().slice(0, 5),
      color: COLORS[i % COLORS.length],
      description: `Mock event for ${MONTHS[m]} ${day}`,
    });
  }
  return evts;
}

export default function CalendarView() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useLocalStorage("brane_calendar_events", []);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [form, setForm] = useState({ title: "", time: "", color: COLORS[0], description: "" });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const daysWithEvents = useMemo(() => {
    const map = {};
    const all = events.length ? events : buildMockEvents();
    all.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = new Date(year, month, selectedDay).toDateString();
    const all = events.length ? events : buildMockEvents();
    return all.filter((e) => e.date === key);
  }, [selectedDay, year, month, events]);

  const goToMonth = useCallback((delta) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    setViewDate(new Date());
    setSelectedDay(null);
  }, []);

  const handleDayClick = useCallback((day) => {
    setSelectedDay(day === selectedDay ? null : day);
  }, [selectedDay]);

  const openAddModal = useCallback(() => {
    const d = selectedDay || today.getDate();
    setForm({
      title: "",
      time: new Date().toTimeString().slice(0, 5),
      color: COLORS[0],
      description: "",
    });
    setShowModal(true);
  }, [selectedDay, today]);

  const handleAddEvent = useCallback(() => {
    if (!form.title.trim()) return;
    const day = selectedDay || today.getDate();
    const newEvent = {
      id: `evt-${Date.now()}`,
      title: form.title,
      date: new Date(year, month, day).toDateString(),
      time: form.time,
      color: form.color,
      description: form.description,
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowModal(false);
    setSelectedDay(day);
  }, [form, selectedDay, year, month, today, setEvents]);

  const handleDelete = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, [setEvents]);

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const monthLabel = `${MONTHS[month]} ${year}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white/80 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-white/90 tracking-tight">Calendar</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
                {["month", "week"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs rounded-md capitalize transition ${
                      viewMode === mode
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-lg text-white/60 hover:text-white/80 transition"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToMonth(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition"
                >
                  ‹
                </button>
                <span className="text-sm font-medium text-white/70 min-w-[140px] text-center">
                  {monthLabel}
                </span>
                <button
                  onClick={() => goToMonth(1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {viewMode === "month" && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[11px] text-white/30 font-medium uppercase tracking-wider py-2">
                    {d}
                  </div>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${year}-${month}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-7 gap-px bg-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden"
                >
                  {grid.map((day, i) => {
                    const key = day ? new Date(year, month, day).toDateString() : null;
                    const dayEvts = key ? daysWithEvents[key] || [] : [];
                    return (
                      <button
                        key={i}
                        onClick={() => day && handleDayClick(day)}
                        className={`relative min-h-[80px] md:min-h-[100px] flex flex-col items-start p-1.5 md:p-2 text-left transition ${
                          day
                            ? "bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer"
                            : "bg-transparent cursor-default"
                        } ${
                          selectedDay === day
                            ? "ring-1 ring-inset ring-white/20 bg-white/[0.06]"
                            : ""
                        }`}
                      >
                        {day && (
                          <>
                            <span
                              className={`text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                                isToday(day)
                                  ? "bg-white/15 text-white"
                                  : "text-white/40"
                              }`}
                            >
                              {day}
                            </span>
                            <div className="flex flex-wrap gap-0.5">
                              {dayEvts.slice(0, 3).map((e) => (
                                <div
                                  key={e.id}
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: e.color }}
                                  title={e.title}
                                />
                              ))}
                              {dayEvts.length > 3 && (
                                <span className="text-[9px] text-white/30 pl-0.5">
                                  +{dayEvts.length - 3}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </>
          )}

          {viewMode === "week" && (
            <div className="flex items-center justify-center h-64 text-white/20 text-sm border border-dashed border-white/[0.06] rounded-xl">
              Week view coming soon
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedDay && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-72 flex-shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 max-h-[600px] overflow-y-auto"
            >
              <div className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1">
                {MONTHS[month]} {selectedDay}, {year}
              </div>
              <h3 className="text-base font-semibold text-white/90 mb-4 capitalize">
                {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long" })}
              </h3>

              {selectedEvents.length === 0 && (
                <p className="text-sm text-white/20 mb-4">No events for this day</p>
              )}

              <div className="space-y-2 mb-5">
                {selectedEvents.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: e.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-white/80 truncate">{e.title}</p>
                          {e.time && (
                            <p className="text-[11px] text-white/30">{e.time}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 text-xs transition"
                      >
                        ✕
                      </button>
                    </div>
                    {e.description && (
                      <p className="text-xs text-white/20 mt-1.5 ml-4 line-clamp-2">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={openAddModal}
                className="w-full py-2 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-white/60 hover:text-white/80 transition"
              >
                + Add Event
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">New Event</h3>
              <div className="space-y-3">
                <input
                  placeholder="Event title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-white/20 focus:bg-white/[0.08] transition"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-white/20 focus:bg-white/[0.08] transition"
                />
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition ${
                        form.color === c ? "ring-2 ring-white/50 scale-110" : "ring-0"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none resize-none focus:border-white/20 focus:bg-white/[0.08] transition"
                />
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
