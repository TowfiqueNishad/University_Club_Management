import React from 'react';
import { AlertTriangle, MapPin, Package } from 'lucide-react';

const ConflictAlert = ({ venueConflict, equipmentConflict }) => {
  const hasVenueConflict = venueConflict?.hasConflict;
  const hasEquipmentConflict = equipmentConflict?.hasConflict;

  if (!hasVenueConflict && !hasEquipmentConflict) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 my-4 animate-fade-in text-rose-900">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-100 rounded-xl text-rose-700 mt-0.5">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-rose-950">Scheduling Conflicts Detected!</h4>
          <p className="text-xs text-rose-800 mt-0.5">
            The requested booking parameters conflict with existing reservations. Please adjust the time, venue, or equipment.
          </p>

          {/* Venue conflicts */}
          {hasVenueConflict && (
            <div className="mt-3 bg-white/80 p-3 rounded-xl border border-rose-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-900">
                <MapPin className="h-3.5 w-3.5" />
                Venue Collision: {venueConflict.venueName} ({venueConflict.roomNumber})
              </div>
              <ul className="mt-1.5 space-y-1 text-xs text-rose-700">
                {venueConflict.conflicts?.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>
                      <strong>{c.type === 'EVENT' ? c.title : c.purpose}</strong> ({c.time})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Equipment conflicts */}
          {hasEquipmentConflict && (
            <div className="mt-3 bg-white/80 p-3 rounded-xl border border-rose-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-900">
                <Package className="h-3.5 w-3.5" />
                Equipment Shortage Clashes
              </div>
              <ul className="mt-1.5 space-y-1 text-xs text-rose-700">
                {equipmentConflict.conflictedItems?.map((eq, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>
                      <strong>{eq.name}</strong>: Requested {eq.requested}, but only {eq.available} left (Total stock: {eq.totalStock})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictAlert;
