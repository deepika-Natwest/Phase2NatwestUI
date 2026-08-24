// src/pages/Leadership.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

function Leadership() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeadership = async () => {
      try {
        const res = await api.get("/api/public/leadership");
        setLeaders(res.data);
      } catch (err) {
        console.error("Failed to fetch leadership:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeadership();
  }, []);

  if (loading) return <div className="text-center my-5">Loading...</div>;
  if (!leaders.length) return <div className="text-center my-5">No records found.</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">Leadership</h2>
      <div className="row">
        {leaders.map((leader, index) => (
          <div key={leader.id} className="col-md-4 mb-3">
            <div className="card h-100 text-center">
              {leader.photo && (
                <img
                  src={getImageUrl(leader.photo)}
                  alt={leader.name}
                  className="card-img-top"
                  style={{ width: "100%", height: "100px", objectFit: "cover" }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{leader.name}</h5>
                <p className="card-text">{leader.designation}</p>
                <p className="card-text">{leader.location}</p>
                <p className="card-text">{leader.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leadership;
