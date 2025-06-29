import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

const UploaderPage = forwardRef(({ user }, ref) => {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const intervalRef = useRef();

  const checkAccess = useCallback(async () => {
    let token = user?.token;
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      token = JSON.parse(userStr)?.token;
      if (!token) return;
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
      setAllowed(!!data.access);
    } catch (err) {
      setAllowed(false);
    } finally {
      setChecked(true);
    }
  }, [user]);

  useImperativeHandle(ref, () => ({
    checkAccess,
  }));

  useEffect(() => {
    checkAccess();
    intervalRef.current = setInterval(() => {
      checkAccess();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [user, checkAccess]);

  if (!checked) return <p>Validating access...</p>;
  if (!allowed) return <p>⛔ Access Denied: Your booked slot has not started yet.</p>;
  return (
    <div>
      <h1>✅ Welcome to Arduino Uploader</h1>
      {/* TODO: Add Arduino uploader UI here */}
    </div>
  );
});

export default UploaderPage;