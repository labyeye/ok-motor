import React, { useEffect, useState } from "react";
import announcementService from "../services/announcementService";

const AnnouncementManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    message: "",
    link: "",
    startDate: "",
    endDate: "",
    active: false,
  });
  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    try {
      const res = await announcementService.list(token);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementService.create(form, token);
      setForm({
        message: "",
        link: "",
        startDate: "",
        endDate: "",
        active: false,
      });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id, val) => {
    try {
      await announcementService.update(id, { active: val }, token);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete announcement?")) return;
    try {
      await announcementService.remove(id, token);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Announcements</h2>
      <p style={{ marginBottom: 12, color: "#4b5563" }}>
        Create an announcement for the website bar. Mark it active to show
        publicly; only one active is kept at a time.
      </p>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr repeat(2, 1fr) auto",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
          border: "1px solid #e5e7eb",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <input
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          style={{ flex: 1 }}
          required
        />
        <input
          placeholder="Link (optional)"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          title="Start date"
        />
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          title="End date"
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />{" "}
          Active
        </label>
        <button type="submit">Create</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #e5e7eb",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Message
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Link
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Start
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                End
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Active
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Updated
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: 8, maxWidth: 360 }}>{it.message}</td>
                <td style={{ padding: 8 }}>
                  {it.link ? (
                    <a href={it.link} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  {it.startDate
                    ? new Date(it.startDate).toLocaleDateString()
                    : "—"}
                </td>
                <td style={{ padding: 8 }}>
                  {it.endDate ? new Date(it.endDate).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={!!it.active}
                    onChange={(e) => toggleActive(it._id, e.target.checked)}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "—"}
                </td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => remove(it._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AnnouncementManager;
