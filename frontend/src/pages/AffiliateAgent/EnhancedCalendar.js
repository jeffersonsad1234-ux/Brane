import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

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
  const d = now.getDate();
  const mockTitles = [
    "Team Standup", "Client Presentation", "BRANPY Sync",
    "Design Review", "Affiliate Meeting", "Lunch",
    "Sprint Planning", "Code Review",
  ];
  return mockTitles.map((title, i) => {
    const day = Math.min(((i + 1) * 3 - 1) % 28 + 1, 28);
    const startH = 9 + (i % 7);
    const startM = (i * 11) % 60;
    const endH = startH + 1;
    const endM = startM + 15;
    const eventDate = new Date(y, m, day);
    return {
      id: `mock-${i}`,
      title,
      date: eventDate.toDateString(),
      startTime: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
      endTime: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
      color: COLORS[i % COLORS.length],
      description: `Description for ${title}`,
    };
  });
}

function toDateStr(year, month, day) {
  return new Date(year, month, day).toDateString();
}

export default function EnhancedCalendar() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [storedEvents, setStoredEvents] = useLocalStorage("brane_enhanced_events", buildMockEvents());
  const [viewMode, setViewMode] = useState("month");
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: "", startTime: "09:00", endTime: "10:00", color: COLORS[0], description: "" });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const events = storedEvents.length ? storedEvents : buildMockEvents();

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    const key = toDateStr(year, month, selectedDay);
    return events.filter((e) => e.date === key);
  }, [selectedDay, year, month, events]);

  const weekDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOfWeek = new Date(first);
    startOfWeek.setDate(first.getDate() - first.getDay() + (selectedDay !== null ? selectedDay - 1 : 0));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month, selectedDay]);

  const navigate = useCallback((delta) => {
    if (viewMode === "month") setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    else {
      setViewDate((prev) => {
        const d = new Date(prev);
        d.setDate(prev.getDate() + delta * (viewMode === "week" ? 7 : 1));
        return d;
      });
    }
  }, [viewMode]);

  const goToday = useCallback(() => {
    setViewDate(new Date());
    setSelectedDay(today.getDate());
  }, [today]);

  const openNewEvent = useCallback((day) => {
    setSelectedDay(day !== undefined ? day : today.getDate());
    setEditingEvent(null);
    setForm({ title: "", startTime: "09:00", endTime: "10:00", color: COLORS[0], description: "" });
    setShowModal(true);
  }, [today]);

  const openEditEvent = useCallback((ev) => {
    setEditingEvent(ev);
    setForm({ title: ev.title, startTime: ev.startTime, endTime: ev.endTime, color: ev.color, description: ev.description || "" });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return;
    const eventDate = toDateStr(year, month, selectedDay);
    if (editingEvent) {
      setStoredEvents((prev) => prev.map((e) => e.id === editingEvent.id ? { ...e, ...form, date: eventDate } : e));
    } else {
      setStoredEvents((prev) => [...prev, { id: `ev-${Date.now()}`, title: form.title.trim(), date: eventDate, startTime: form.startTime, endTime: form.endTime, color: form.color, description: form.description.trim() }]);
    }
    setShowModal(false);
    setEditingEvent(null);
  }, [form, selectedDay, year, month, editingEvent, setStoredEvents]);

  const deleteEvent = useCallback((id) => {
    setStoredEvents((prev) => prev.filter((e) => e.id !== id));
  }, [setStoredEvents]);

  const monthLabel = `${MONTHS[month]} ${year}`;
  const selectedDateStr = selectedDay !== null ? new Date(year, month, selectedDay).toDateString() : "";

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white/90 tracking-tight">Calendar</h1>
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-lg p-0.5">
              {["month", "week", "day"].map((m) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition ${
                    viewMode === m ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"
                  }`}
                >{m.charAt(0).toUpperCase() + m.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.06] text-white/30 hover:text-white/60 transition text-sm">‹</button>
            <span className="text-sm font-medium text-white/70 min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => navigate(1)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.06] text-white/30 hover:text-white/60 transition text-sm">›</button>
            <button onClick={goToday} className="ml-2 px-3 py-1 text-[10px] font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/40 border border-white/[0.06] transition">Today</button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            {viewMode === "month" && (
              <div className={cx + " flex-1"}>
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-[10px] text-white/30 uppercase tracking-wider text-center py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {grid.map((day, i) => {
                    const key = day ? toDateStr(year, month, day) : `empty-${i}`;
                    const dayEvents = day ? eventsByDate[key] || [] : [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    return (
                      <div key={i}
                        onClick={() => day && setSelectedDay(day)}
                        className={`min-h-[60px] rounded-lg p-1.5 transition cursor-pointer ${
                          day ? "hover:bg-white/[0.04]" : ""
                        } ${selectedDay === day ? "bg-white/[0.06]" : ""} ${isToday ? "ring-1 ring-cyan-500/30" : ""}`}
                      >
                        {day && (
                          <>
                            <div className="text-[11px] text-white/50 font-medium mb-1">{day}</div>
                            {dayEvents.slice(0, 3).map((ev) => (
                              <div key={ev.id} className="w-full h-1.5 rounded-full mb-0.5" style={{ backgroundColor: ev.color }} />
                            ))}
                            {dayEvents.length > 3 && <div className="text-[8px] text-white/20">+{dayEvents.length - 3}</div>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "week" && (
              <div className={cx + " flex-1 overflow-y-auto"}>
                <div className="grid grid-cols-7 border-b border-white/[0.04] mb-1">
                  {weekDays.map((d, i) => {
                    const isToday = d.toDateString() === today.toDateString();
                    return (
                      <div key={i} className={`text-center py-1.5 ${isToday ? "text-cyan-400" : "text-white/40"} text-[10px] font-medium`}>
                        {WEEKDAYS[d.getDay()]} {d.getDate()}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {HOURS.map((hour) => (
                    weekDays.map((d, dayIdx) => {
                      const key = d.toDateString();
                      const timeStr = `${String(hour).padStart(2, "0")}:00`;
                      const cellEvents = events.filter((e) => e.date === key && e.startTime.startsWith(String(hour).padStart(2, "0")));
                      return (
                        <div key={`${hour}-${dayIdx}`}
                          onClick={() => { setSelectedDay(d.getDate()); setViewDate(d); openNewEvent(d.getDate()); }}
                          className="min-h-[36px] border-t border-white/[0.02] text-[9px] text-white/20 hover:bg-white/[0.02] cursor-pointer p-0.5"
                        >
                          <div className="text-[8px] text-white/15">{hour}:00</div>
                          {cellEvents.map((ev) => (
                            <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                              className="text-[8px] text-white/80 px-1 rounded truncate mt-px cursor-pointer" style={{ backgroundColor: ev.color + "44" }}
                            >{ev.title}</div>
                          ))}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
            )}

            {viewMode === "day" && (
              <div className={cx + " flex-1 overflow-y-auto"}>
                <div className="text-center text-sm text-white/60 font-medium py-2 border-b border-white/[0.04] mb-2">
                  {selectedDay !== null ? new Date(year, month, selectedDay).toDateString() : monthLabel}
                </div>
                {HOURS.map((hour) => {
                  const timeStr = `${String(hour).padStart(2, "0")}:00`;
                  const key = selectedDay !== null ? toDateStr(year, month, selectedDay) : "";
                  const hourEvents = events.filter((e) => e.date === key && e.startTime.startsWith(String(hour).padStart(2, "0")));
                  return (
                    <div key={hour}
                      onClick={() => openNewEvent(selectedDay)}
                      className="flex gap-3 min-h-[44px] border-t border-white/[0.02] hover:bg-white/[0.02] cursor-pointer py-1"
                    >
                      <div className="w-12 text-[10px] text-white/25 text-right flex-shrink-0 pt-1">{timeStr}</div>
                      <div className="flex-1 space-y-1">
                        {hourEvents.map((ev) => (
                          <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                            className="rounded px-2 py-1 text-xs text-white/80 flex items-center justify-between group"
                            style={{ backgroundColor: ev.color + "33", borderLeft: `3px solid ${ev.color}` }}
                          >
                            <span>{ev.title}</span>
                            <span className="text-[9px] text-white/30">{ev.startTime}-{ev.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-64 flex-shrink-0 space-y-3">
            <div className={cx}>
              <div className="flex items-center justify-between mb-3">
                <div className={lx + " mb-0"}>Events</div>
                <button onClick={() => openNewEvent(selectedDay !== null ? selectedDay : today.getDate())}
                  className="text-[10px] text-cyan-400/70 hover:text-cyan-400 transition"
                >+ New</button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {selectedDayEvents.length === 0 && (
                  <div className="text-[11px] text-white/20 text-center py-4">No events</div>
                )}
                {selectedDayEvents.map((ev) => (
                  <div key={ev.id}
                    onClick={() => openEditEvent(ev)}
                    className="rounded-lg p-2.5 border border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition group"
                    style={{ borderLeftColor: ev.color, borderLeftWidth: "3px" }}
                  >
                    <div className="text-xs font-medium text-white/70 truncate">{ev.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-[9px] text-white/30">{ev.startTime} - {ev.endTime}</div>
                      <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                        className="ml-auto text-[9px] text-red-400/0 group-hover:text-red-400/60 transition"
                      >✕</button>
                    </div>
                    {ev.description && <div className="text-[9px] text-white/20 mt-1 truncate">{ev.description}</div>}
                  </div>
                ))}
              </div>
            </div>
            {selectedDay !== null && (
              <div className={cx}>
                <div className={lx}>Selected Date</div>
                <div className="text-xs text-white/60">{selectedDateStr}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">{editingEvent ? "Edit Event" : "New Event"}</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Event Title" className={ix} autoFocus />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className={lx}>Start</div>
                    <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={ix} />
                  </div>
                  <div>
                    <div className={lx}>End</div>
                    <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className={ix} />
                  </div>
                </div>
                <div>
                  <div className={lx}>Color</div>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))}
                        className={`w-7 h-7 rounded-lg border-2 transition ${form.color === c ? "border-white/60" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)" rows={2} className={ix + " resize-none"} />
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setShowModal(false); setEditingEvent(null); }}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                {editingEvent && (
                  <button onClick={() => { deleteEvent(editingEvent.id); setShowModal(false); setEditingEvent(null); }}
                    className="py-2 px-3 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                  >Delete</button>
                )}
                <button onClick={handleSave}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >{editingEvent ? "Update" : "Create"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
