import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import './TimeSlot.css';

export default function TimeSlot({ user }) {
  const [bookedSlots, setBookedSlots] = useState({});
  const [userMap, setUserMap] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const generateTimeSlots = useCallback(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  }, []);

  const formatTo12Hour = (timeStr) => {
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${period}`;
  };

  const slots = generateTimeSlots();

  const handleSlotClick = useCallback((slotTime) => {
    if (!user?.id || !socketRef.current || connectionStatus !== 'connected') {
      alert('Please wait for connection or login again.');
      return;
    }


    const isBooked = !!bookedSlots[slotTime];
    const isBookedByUser = String(bookedSlots[slotTime]) === String(user.id);
    const bookedBy = userMap[bookedSlots[slotTime]] || 'Someone';

    if (isBooked && !isBookedByUser) {
      alert(`Slot already booked by ${bookedBy}`);
      return;
    }

    const hour = parseInt(slotTime.split(":")[0], 10);
    const slotPeriod = hour < 12 ? 'AM' : 'PM';

    if (isBookedByUser) {
      socketRef.current.emit('unbook-slot', { slotTime });  // send 24-hour format
    } else {
      socketRef.current.emit('book-slot', {
        slotTime,
        slotPeriod
      });
    }
  }, [bookedSlots, connectionStatus, user, userMap]);

  useEffect(() => {
    if (!user?.token) {
      navigate('/login');
      return;
    }

    const socket = io('http://localhost:8000', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: user.token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get('http://localhost:8000/bookings', {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const bookingsMap = {};
        const usersMap = {};
        data.forEach(booking => {
          const date = new Date(booking.slotTime);
          const timeKey = date.toTimeString().slice(0, 5); // HH:MM
          bookingsMap[timeKey] = booking.userId;
          usersMap[booking.userId] = booking.username;
        });

        setBookedSlots(bookingsMap);
        setUserMap(usersMap);
      } catch (err) {
        console.error('Initialization error:', err);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', (err) => {
      setConnectionStatus('error');
      if (err.message.includes('auth')) {
        setTimeout(() => navigate('/login'), 1500);
      }
    });

    socket.on('slot-updated', ({ slotTime, userId, username }) => {
      setBookedSlots(prev => ({ ...prev, [slotTime]: userId }));
      setUserMap(prev => ({ ...prev, [userId]: username }));
    });

    socket.on('slot-cleared', ({ slotTime }) => {
      setBookedSlots(prev => {
        const updated = { ...prev };
        delete updated[slotTime];
        return updated;
      });
    });

    socket.on('booking-error', ({ message }) => {
      alert(`Booking Error: ${message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  if (!user?.id) {
    return <p className="error-message">User session expired. Please log in again.</p>;
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <h3>Loading Time Slots</h3>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="time-slot-container">
      <header className="time-slot-header">
        <h1>Welcome, {user.username}</h1>
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'connected' ? 'Online' :
            connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
        </div>
      </header>

      <div className="time-slot-grid">
        {slots.map(slotTime => {
          const isBooked = !!bookedSlots[slotTime];
          const isBookedByUser = String(bookedSlots[slotTime]) === String(user.id);
          //const bookedBy = userMap[bookedSlots[slotTime]] || 'Someone';

          return (
            <div
              key={slotTime}
              className={`time-slot-card ${
                isBooked
                  ? isBookedByUser ? 'booked-by-you' : 'booked-by-other'
                  : 'available'
              }`}
              onClick={() => handleSlotClick(slotTime)}
            >
              <div className="time-display">{formatTo12Hour(slotTime)}</div>

              <div className="slot-status">
                {isBooked
                  ? isBookedByUser
                    ? 'Your Booking (Click to Cancel)'
                    : 'Booked'
                  : 'Available - Click to Book'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
