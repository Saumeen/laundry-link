'use client';

import { useState, useEffect } from 'react';

// Time slot configuration interface
interface TimeSlotConfig {
  slotDuration: number;
  startTime: string;
  endTime: string;
}

// Generated time slot interface
interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TimeSelectionProps {
  pickupDate: string;
  deliveryDate: string;
  pickupTimeSlot: string;
  deliveryTimeSlot: string;
  onTimeChange: (field: string, value: string) => void;
  validationError: string;
}

export default function TimeSelection({
  pickupDate,
  deliveryDate,
  pickupTimeSlot,
  deliveryTimeSlot,
  onTimeChange,
  validationError,
}: TimeSelectionProps) {
  const [config, setConfig] = useState<TimeSlotConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch time slot configuration from database
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/time-slots');
        if (response.ok) {
          const data = (await response.json()) as { config: TimeSlotConfig };
          setConfig(data.config);
        } else {
          console.error('Failed to fetch time slot configuration');
          // Fallback to default configuration
          setConfig({
            slotDuration: 3,
            startTime: '09:00',
            endTime: '21:00',
          });
        }
      } catch (error) {
        console.error('Error fetching time slot configuration:', error);
        // Fallback to default configuration
        setConfig({
          slotDuration: 3,
          startTime: '09:00',
          endTime: '21:00',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Generate time slots based on configuration
  const generateTimeSlots = (config: TimeSlotConfig): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = parseInt(config.startTime.split(':')[0]);
    const endHour = parseInt(config.endTime.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour += config.slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endHour = hour + config.slotDuration;
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;
      const id = `${startTime.replace(':', '-')}-${endTime.replace(':', '-')}`;

      slots.push({
        id,
        label: `${startTime} - ${endTime}`,
        startTime,
        endTime,
        isActive: true,
      });
    }

    return slots;
  };

  // Get current Bahrain time
  const getCurrentBahrainTime = () => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bahrain',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Get current Bahrain date
  const getCurrentBahrainDate = () => {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Bahrain',
    });
  };

  // Convert Bahrain time to UTC
  const convertBahrainToUTC = (date: string, time: string) => {
    // Create a date string in Bahrain timezone
    const bahrainDateTimeString = `${date}T${time}`;

    // Parse the date as Bahrain time and convert to UTC
    const bahrainDate = new Date(bahrainDateTimeString + '+03:00'); // Bahrain is UTC+3

    // Return ISO string in UTC
    return bahrainDate.toISOString();
  };

  // Convert UTC to Bahrain time
  const convertUTCToBahrain = (utcDateTime: string) => {
    const date = new Date(utcDateTime);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Bahrain',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Check if time slot is in the past for current day
  const isTimeSlotInPast = (slot: TimeSlot, date: string) => {
    const currentDate = getCurrentBahrainDate();
    if (date !== currentDate) return false;

    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bahrain',
      hour12: false,
    });
    const currentHour = parseInt(currentTime.split(', ')[1].split(':')[0]);
    const currentMinute = parseInt(currentTime.split(', ')[1].split(':')[1]);

    const slotStartHour = parseInt(slot.startTime.split(':')[0]);
    const slotStartMinute = parseInt(slot.startTime.split(':')[1]);

    return (
      slotStartHour < currentHour ||
      (slotStartHour === currentHour && slotStartMinute <= currentMinute)
    );
  };

  // Generate time slots if config is available
  let timeSlots: TimeSlot[] = [];
  if (config) {
    timeSlots = generateTimeSlots(config);
  }

  // Filter available time slots (hide past slots for current day)
  const availableTimeSlots = timeSlots.filter(
    slot => !isTimeSlotInPast(slot, pickupDate)
  );

  // Get available delivery slots based on pickup slot and dates
  const getAvailableDeliverySlots = () => {
    // Filter delivery time slots based on delivery date (not pickup date)
    const deliveryTimeSlots = timeSlots.filter(
      slot => !isTimeSlotInPast(slot, deliveryDate)
    );

    // If delivery date is different from pickup date, show all available delivery slots
    if (pickupDate !== deliveryDate) {
      return deliveryTimeSlots;
    }

    // If no pickup slot selected, show all available delivery slots
    if (!pickupTimeSlot) return deliveryTimeSlots;

    const pickupSlot = availableTimeSlots.find(
      slot => slot.id === pickupTimeSlot
    );

    if (!pickupSlot) return deliveryTimeSlots;

    // Same day delivery - filter out slots that are before pickup time
    return deliveryTimeSlots.filter(slot => {
      const pickupStart = new Date(`${pickupDate}T${pickupSlot.startTime}`);
      const deliveryStart = new Date(`${deliveryDate}T${slot.startTime}`);

      // Delivery must be after pickup (minimum 1 hour gap)
      const minDeliveryTime = new Date(pickupStart.getTime() + 60 * 60 * 1000);

      return deliveryStart >= minDeliveryTime;
    });
  };

  // Recalculate available delivery slots when dates change
  useEffect(() => {
    const availableSlots = getAvailableDeliverySlots();
    // If current delivery slot is not available, clear it
    if (
      deliveryTimeSlot &&
      !availableSlots.find(slot => slot.id === deliveryTimeSlot)
    ) {
      onTimeChange('deliveryTimeSlot', '');
    }
  }, [pickupDate, deliveryDate, pickupTimeSlot]);

  const availableDeliverySlots = getAvailableDeliverySlots();

  // Enhanced time change handler that stores time ranges
  const handleTimeSlotChange = (
    type: 'pickup' | 'delivery',
    slotId: string
  ) => {
    const slot = timeSlots.find(s => s.id === slotId);
    if (slot) {
      let date: string;
      if (type === 'pickup') {
        date = pickupDate;
      } else {
        date = deliveryDate;
      }
      const startTimeUTC = convertBahrainToUTC(date, slot.startTime);
      const endTimeUTC = convertBahrainToUTC(date, slot.endTime);

      // Store the slot ID and time ranges
      onTimeChange(`${type}TimeSlot`, slotId);
      onTimeChange(`${type}StartTimeUTC`, startTimeUTC || '');
      onTimeChange(`${type}EndTimeUTC`, endTimeUTC || '');
    }
  };

  // Get current Bahrain time display (dev only)
  const currentBahrainTime = getCurrentBahrainTime();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold text-gray-900'>
          Select Time (Bahrain Time)
        </h2>
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Loading time slots...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-gray-900'>
        Select Time (Bahrain Time)
      </h2>
      <p className='text-gray-600'>
        Choose your preferred pickup and delivery times
      </p>

      {/* Current Bahrain Time Display - Dev Only */}
      {isDevelopment && (
        <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-sm text-blue-800'>
            <strong>Current Bahrain Time:</strong> {currentBahrainTime}
          </p>
          {config && (
            <p className='text-xs text-blue-600 mt-1'>
              <strong>Time Slot Configuration:</strong> {config.slotDuration}
              -hour slots from {config.startTime} to {config.endTime}
            </p>
          )}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className='p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {validationError}
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Pickup Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Pickup</h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date *
            </label>
            <input
              type='date'
              value={pickupDate}
              onChange={e => onTimeChange('pickupDate', e.target.value)}
              min={getCurrentBahrainDate()}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Time Slot *
            </label>
            <div className='grid grid-cols-1 gap-2'>
              {availableTimeSlots.map(slot => (
                <button
                  key={slot.id}
                  type='button'
                  onClick={() => handleTimeSlotChange('pickup', slot.id)}
                  className={`p-3 text-left border-2 rounded-lg transition-all ${
                    pickupTimeSlot === slot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className='font-medium'>{slot.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Delivery</h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date *
            </label>
            <input
              type='date'
              value={deliveryDate}
              onChange={e => onTimeChange('deliveryDate', e.target.value)}
              min={pickupDate || getCurrentBahrainDate()}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Time Slot *
            </label>
            <div className='grid grid-cols-1 gap-2'>
              {availableDeliverySlots.map(slot => (
                <button
                  key={slot.id}
                  type='button'
                  onClick={() => handleTimeSlotChange('delivery', slot.id)}
                  className={`p-3 text-left border-2 rounded-lg transition-all ${
                    deliveryTimeSlot === slot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className='font-medium'>{slot.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
