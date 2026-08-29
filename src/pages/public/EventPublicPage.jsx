import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getPublicEvents } from "../../features/events/publicEventService";
import defaultEventImg from "../../assets/img/default-event.png";


function EventPublicPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(""); // filter month
  const [year, setYear] = useState(""); // filter year

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicEvents();
        setEvents(res.data);
        setFilteredEvents(res.data);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Parse date-only strings as local time to avoid UTC timezone shift
  const parseLocalDate = (dateStr) =>
    new Date(String(dateStr).slice(0, 10) + "T00:00:00");

  // Filter whenever month or year changes
  useEffect(() => {
    let filtered = [...events];
    if (month) {
      filtered = filtered.filter(
        (e) => parseLocalDate(e.date).getMonth() + 1 === parseInt(month)
      );
    }
    if (year) {
      filtered = filtered.filter(
        (e) => parseLocalDate(e.date).getFullYear() === parseInt(year)
      );
    }
    setFilteredEvents(filtered);
  }, [month, year, events]);

  // Generate years from events
  const years = Array.from(
    new Set(events.map((e) => parseLocalDate(e.date).getFullYear()))
  ).sort((a, b) => b - a);

  return (
    <>
      <Header />
      <div className="recog-detailed-heading p-3 mb-5">
      <div className="container">
        <div className="row w100">
            <div className="col-8  d-flex">
                <span className="recog-main-side-line"><span className="trophy-emoji" role="img" aria-label="trophy">📢</span></span>
                <span className="recog-main-title">Event Calendar</span>
            </div>
             <div className="col-2 mt-3">
                    <select
              className="form-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
             </div>
              <div className="col-2 mt-3">
                  <select
              className="form-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
              </div>
        </div>

      </div>
      </div>
      <div className="container my-5">




        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center mt-5">No events found.</div>
        ) : (
          <div className="row">
            {filteredEvents.map((event) => (
              <div key={event.id} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm eventCard">
                  {event.status && (
                    <span className={`eventStatus status-${event.status.toLowerCase()}`}>
                      {event.status}
                    </span>
                  )}
                  <img
                    src={event.eventImage ? `/uploads/events/${event.eventImage}` : defaultEventImg}
                    className="card-img-top"
                    alt={event.eventName}
                    style={{ height: "250px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{event.eventName}</h5>
                    {event.description && <p className="mt-2">{event.description}</p>}
                    <p className="card-subtitle text-muted mb-1">
                      {event.location} | {parseLocalDate(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default EventPublicPage;