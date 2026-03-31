import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../features/events/eventService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";
import { LOCATION_OPTIONS, STATUS_EVENTS } from "../../utils/userConfig";

function EventsPage() {
  const role = getUserRole();

  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventImage, setEventImage] = useState(null);

  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    tag: "",
    location: "",
    description: "",
    status: "",
  });

  const loadData = async () => {
    const res = await getEvents();
    setEvents(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (event = null) => {
    setCurrentEvent(event);
    setFormData(
      event || {
        eventName: "",
        date: "",
        tag: "",
        location: "",
        description: "",
        status: "",
      }
    );
    setEventImage(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentEvent(null);
    setEventImage(null);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (eventImage) data.append("eventImage", eventImage);

    if (currentEvent) {
      await updateEvent(currentEvent.id, data);
    } else {
      await createEvent(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this event?")) {
      await deleteEvent(id);
      loadData();
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Event Manager</h2>
        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            Add Event
          </button>
        )}
      </div>

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.eventName}</td>
                <td>{event.date}</td>
                <td>{event.location}</td>
                <td>{event.status}</td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openModal(event)}
                    >
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(event.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentEvent ? "Edit Event" : "Add Event"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  ></button>
                </div>

                <div className="modal-body row">
                  <div className="col-md-6 mb-3">
                    <label>Event Name</label>
                    <input
                      type="text"
                      name="eventName"
                      className="form-control"
                      value={formData.eventName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Tag</label>
                    <input
                      type="text"
                      name="tag"
                      className="form-control"
                      value={formData.tag}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Location</label>
                    <select
                      name="location"
                      className="form-control"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {LOCATION_OPTIONS.map((loc) => (
                        <option key={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Status</label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      {STATUS_EVENTS.map((loc) => (
                        <option key={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Event Image</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) =>
                        setEventImage(e.target.files[0])
                      }
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label>Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default EventsPage;