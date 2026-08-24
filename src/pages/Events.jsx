// src/pages/Events.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/api/public/events");
        console.log("Fetched events:", res.data); // debug
        setEvents(res.data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="text-center my-5">Loading...</div>;
  if (!events.length) return <div className="text-center my-5">No events found.</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">Events</h2>
      <div className="row">
        {events.map((event) => (
          <div key={event.id} className="col-md-4 mb-3">
            <div className="card h-100">
              {event.image && (
                <img
                  src={getImageUrl(event.image)}
                  alt={event.name}
                  className="card-img-top"
                  style={{ width: "100%", height: "100px", objectFit: "cover" }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{event.name}</h5>
                <p className="card-text">{event.tag}</p>
                <p className="card-text">{event.description}</p>
                <p className="card-text"><small>Date: {event.date}</small></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;
