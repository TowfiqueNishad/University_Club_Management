import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Handshake,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';

const EVENT_TYPES = [
  'ALL',
  'Workshop',
  'Hackathon',
  'Seminar',
  'Cultural Night',
  'Sports Tournament',
  'Networking',
  'Exhibition',
  'General Meeting',
];

const EventsList = () => {
  const { user, isLeader, isAdmin, isMember } = useAuth();
  const { showToast } = useNotification();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [selectedType]);

  const fetchEvents = async () => {
    try {
      let url = `/events?eventType=${selectedType}`;
      const res = await api.get(url);
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/attendance/events/${eventId}/register`);
      if (res.data.success) {
        showToast(res.data.message, 'success', 'Event Registration');
        fetchEvents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  const filteredEvents = events.filter((evt) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      evt.title.toLowerCase().includes(s) ||
      evt.description.toLowerCase().includes(s) ||
      evt.customLocation?.toLowerCase().includes(s) ||
      evt.club?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Campus Activity Calendar
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Campus Events & Workshops</h1>
          <p className="text-xs text-slate-500 font-medium">
            Explore inter-club hackathons, tech seminars, and collaborative student initiatives.
          </p>
        </div>

        {(isLeader || isAdmin || isMember) && (
          <Link
            to="/events/create"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Create Event Proposal
          </Link>
        )}
      </div>

      {/* Filter / Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title, organizer, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isFull = evt.registeredCount >= evt.capacity;
            const acceptedPartners = evt.collaboratingClubs?.filter((c) => c.status === 'ACCEPTED') || [];

            return (
              <div
                key={evt._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Event Top Banner */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    <img
                      src={
                        evt.banner ||
                        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <StatusBadge status={evt.status} />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[11px] font-bold">
                      {evt.eventType}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Club host info */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={evt.club?.logo || 'https://via.placeholder.com/30'}
                        alt=""
                        className="h-5 w-5 rounded-md object-cover"
                      />
                      <span className="text-[11px] font-bold text-slate-600 truncate">
                        {evt.club?.name}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    {/* Meta info: Date, Venue, Capacity */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-600 shrink-0" />
                        <span>
                          {evt.date} ({evt.startTime} - {evt.endTime})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
                        <span className="truncate">{evt.venue?.name || evt.customLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand-600 shrink-0" />
                        <span>
                          Capacity: <strong>{evt.registeredCount || 0} / {evt.capacity}</strong>
                          {isFull && <span className="text-purple-600 font-bold ml-1.5">(Waitlist Open)</span>}
                        </span>
                      </div>
                    </div>

                    {/* Multi-Club Collaboration Partners */}
                    {acceptedPartners.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Handshake className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Co-hosted with: <strong>{acceptedPartners.map((p) => p.club?.name).join(', ')}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card CTA Footer */}
                <div className="p-5 pt-0 flex items-center justify-between gap-3">
                  <Link
                    to={`/events/${evt._id}`}
                    className="text-xs font-bold text-slate-700 hover:text-brand-600 transition-colors"
                  >
                    View Details →
                  </Link>

                  <button
                    onClick={(e) => handleRegister(evt._id, e)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      isFull
                        ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                    }`}
                  >
                    {isFull ? 'Join Waitlist' : 'Register Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          No events found for the selected filter.
        </div>
      )}
    </div>
  );
};

export default EventsList;
