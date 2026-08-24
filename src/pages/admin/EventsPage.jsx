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

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Bulk edit state
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ location: "", status: "" });
  const [bulkEditing, setBulkEditing] = useState(false);

  const loadData = async () => {
    const res = await getEvents();
    setEvents(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (event = null) => {
    setCurrentEvent(event);
    setFormData(event || { eventName: "", date: "", tag: "", location: "", description: "", status: "" });
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

  // ── Bulk delete helpers ───────────────────────────
  const allSelected =
    events.length > 0 && events.every(e => selectedIds.has(e.id));
  const someSelected =
    events.some(e => selectedIds.has(e.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map(e => e.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteEvent(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkEdit = async () => {
    const changes = Object.fromEntries(
      Object.entries(bulkEditData).filter(([, v]) => v !== "")
    );
    if (!Object.keys(changes).length) { setBulkEditOpen(false); return; }
    setBulkEditing(true);
    try {
      await Promise.all(
        [...selectedIds].map(id => {
          const existing = events.find(e => e.id === id);
          const merged = { ...existing, ...changes };
          const data = new FormData();
          Object.entries(merged).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k !== "eventImage") data.append(k, v);
          });
          return updateEvent(id, data);
        })
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  const selectedCount = selectedIds.size;

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

      {/* Bulk delete toolbar */}
      {hasAnyRole(role, [ROLES.ADMIN]) && selectedCount > 0 && (
        <div className="searchHeadBox p-3">
          <div className="d-flex justify-content-center">
            {!confirmDelete ? (
              <div className="d-inline-flex gap-2">
                <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Selected ({selectedCount})
                </button>
                {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                  <button className="btn btn-info" onClick={() => { setBulkEditData({ location: "", status: "" }); setBulkEditOpen(true); }}>
                    Edit Selected ({selectedCount})
                  </button>
                )}
              </div>
            ) : (
              <div className="d-inline-flex align-items-center gap-2
                              border border-danger rounded px-3 py-1"
                   style={{ background: "#fff5f5" }}>
                <span className="text-danger fw-semibold" style={{ fontSize: "14px" }}>
                  Delete {selectedCount} event{selectedCount !== 1 ? "s" : ""}?
                </span>
                <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th style={{ width: "42px" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleSelectAll}
                  title={allSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th>Name</th>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} style={selectedIds.has(event.id) ? { background: "#fff1f1" } : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(event.id)}
                    onChange={() => toggleOne(event.id)}
                  />
                </td>
                <td>{event.eventName}</td>
                <td>{event.date}</td>
                <td>{event.location}</td>
                <td>{event.status}</td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button className="btn btn-sm btn-warning me-2" onClick={() => openModal(event)}>
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">No events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{currentEvent ? "Edit Event" : "Add Event"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body row">
                  <div className="col-md-6 mb-3">
                    <label>Event Name</label>
                    <input type="text" name="eventName" className="form-control" value={formData.eventName} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Date</label>
                    <input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Tag</label>
                    <input type="text" name="tag" className="form-control" value={formData.tag} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Location</label>
                    <select name="location" className="form-control" value={formData.location} onChange={handleChange} required>
                      <option value="">Select</option>
                      {LOCATION_OPTIONS.map((loc) => <option key={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Status</label>
                    <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                      <option value="">Select</option>
                      {STATUS_EVENTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Event Image</label>
                    <input type="file" className="form-control" onChange={(e) => setEventImage(e.target.files[0])} />
                  </div>
                  <div className="col-12 mb-3">
                    <label>Description</label>
                    <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {bulkEditOpen && (
        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bulk Edit — {selectedCount} event{selectedCount !== 1 ? "s" : ""}</h5>
                <button type="button" className="btn-close" onClick={() => setBulkEditOpen(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Leave a field blank to keep existing values unchanged.</p>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <select className="form-select" value={bulkEditData.location}
                    onChange={e => setBulkEditData(prev => ({ ...prev, location: e.target.value }))}>
                    <option value="">— keep existing —</option>
                    {LOCATION_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={bulkEditData.status}
                    onChange={e => setBulkEditData(prev => ({ ...prev, status: e.target.value }))}>
                    <option value="">— keep existing —</option>
                    {STATUS_EVENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBulkEditOpen(false)} disabled={bulkEditing}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkEdit} disabled={bulkEditing}>
                  {bulkEditing ? "Saving…" : `Apply to ${selectedCount} event${selectedCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default EventsPage;
