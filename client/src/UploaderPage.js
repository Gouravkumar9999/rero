import React, { useEffect, useState } from "react";

function UploaderPage() {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const userStr = localStorage.getItem("user");
      console.log("[UploaderPage] localStorage user:", userStr);
  
      if (!userStr) {
        console.warn("[UploaderPage] No user found in localStorage");
        return;
      }
  
      const user = JSON.parse(userStr);
      const token = user?.token;
  
      console.log("[UploaderPage] extracted token:", token);
  
      if (!token) {
        console.warn("[UploaderPage] No token found");
        return;
      }
  
      try {
        const res = await fetch("http://localhost:8000/validate-slot-access", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
        const data = await res.json();
        console.log("Slot access response:", data);
        setAllowed(data.access);
      } catch (err) {
        console.error("Error validating slot access:", err);
        setAllowed(false);
      } finally {
        setChecked(true);
      }
    };
  
    checkAccess();
  }, []);
  

  if (!checked) return <p>Validating access...</p>;
  if (!allowed) return <p>⛔ Access Denied: Your booked slot has not started yet.</p>;

  return (
    <div>
      <h1>✅ Welcome to Arduino Uploader</h1>
      {/* TODO: Add Arduino uploader UI from GitHub here */}
    </div>
  );
}

export default UploaderPage;
