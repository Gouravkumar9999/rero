import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

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

  const fetchInitialData = useCallback(async () => {
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
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [user.token, navigate]);

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
      socketRef.current.emit('unbook-slot', { slotTime });
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

    fetchInitialData();

    const intervalId = setInterval(fetchInitialData, 1000);

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
      clearInterval(intervalId);
    };
  }, [user, navigate, fetchInitialData]);

  if (!user?.id) {
    return <p className="text-red-500 text-center mt-20">User session expired. Please log in again.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">Loading Time Slots</h3>
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {user.username}
        </h1>
        <div
          className={`px-4 py-2 rounded-full font-bold text-sm text-white transition
          ${connectionStatus === 'connected'
            ? 'bg-green-500'
            : connectionStatus === 'error'
            ? 'bg-red-500'
            : 'bg-yellow-400 text-gray-900'
          }`}
        >
          {connectionStatus === 'connected'
            ? 'Online'
            : connectionStatus === 'error'
            ? 'Connection Error'
            : 'Connecting...'}
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {slots.map(slotTime => {
          const isBooked = !!bookedSlots[slotTime];
          const isBookedByUser = String(bookedSlots[slotTime]) === String(user.id);

          return (
            <div
              key={slotTime}
              className={`
                p-4 rounded-lg shadow-md cursor-pointer text-center font-semibold text-lg transition-all duration-150
                ${isBooked
                  ? isBookedByUser
                    ? 'bg-blue-500 dark:bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-800'
                    : 'bg-red-500 dark:bg-red-700 text-white opacity-70 cursor-not-allowed'
                  : 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700'}
              `}
              onClick={() => handleSlotClick(slotTime)}
            >
              <div className="mb-2 text-xl font-bold">{formatTo12Hour(slotTime)}</div>
              <div className="text-sm">
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
