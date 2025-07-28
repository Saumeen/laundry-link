import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
  warning?: string;
  disabled?: boolean;
  className?: string;
  showTimezone?: boolean;
  timezone?: string;
  allowCurrentDay?: boolean;
  autoUpdate?: boolean;
  onValueChange?: (getValue: () => string) => void;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  displayTime: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date and time',
  minDate,
  maxDate,
  error,
  warning,
  disabled = false,
  className = '',
  showTimezone = true,
  timezone = 'Asia/Bahrain',
  allowCurrentDay = false,
  autoUpdate = true,
  onValueChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate time slots (every 30 minutes from 8 AM to 8 PM)
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 20;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        slots.push({
          id: timeString,
          startTime: timeString,
          endTime: endTimeString,
          displayTime: `${timeString} - ${endTimeString}`,
        });
      }
    }

    return slots;
  }, []);

  const timeSlots = generateTimeSlots();

  // Convert Bahrain time to UTC using proper timezone handling
  const convertToUTC = useCallback(
    (date: string, time: string): string => {
      if (!date || !time) return '';

      // Parse the date and time components
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);

      // Create a date object representing the local time in Bahrain
      const bahrainDateTime = new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        0,
        0
      );

      // Get the timezone offset for Bahrain at this specific date/time
      const bahrainOffsetMs = getTimezoneOffsetForDate(
        bahrainDateTime,
        timezone
      );

      // Convert to UTC by subtracting the Bahrain offset
      const utcDateTime = new Date(bahrainDateTime.getTime() - bahrainOffsetMs);

      return utcDateTime.toISOString();
    },
    [timezone]
  );

  // Helper function to get timezone offset
  const getTimezoneOffsetForDate = useCallback(
    (date: Date, timezone: string): number => {
      // Create a date in the target timezone
      const targetDate = new Date(
        date.toLocaleString('en-US', { timeZone: timezone })
      );

      // Create a date in UTC
      const utcDate = new Date(
        date.toLocaleString('en-US', { timeZone: 'UTC' })
      );

      // Calculate the difference in milliseconds
      return targetDate.getTime() - utcDate.getTime();
    },
    []
  );

  // Convert UTC to Bahrain time for display
  const convertFromUTC = useCallback(
    (utcDateTime: string): { date: string; time: string } => {
      if (!utcDateTime) return { date: '', time: '' };

      const date = new Date(utcDateTime);
      const bahrainDate = date.toLocaleDateString('en-CA', {
        timeZone: timezone,
      });
      const bahrainTime = date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      return { date: bahrainDate, time: bahrainTime };
    },
    [timezone]
  );

  // Initialize component with current value
  useEffect(() => {
    if (value) {
      const { date, time } = convertFromUTC(value);
      setSelectedDate(date);
      setSelectedTime(time);
    }
  }, [value, convertFromUTC]);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    // Get today's date in the specified timezone
    const today = new Date();
    const todayInTimezone = new Date(
      today.toLocaleDateString('en-CA', { timeZone: timezone })
    );
    todayInTimezone.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === todayInTimezone.toDateString();
      const isSelected = selectedDate
        ? date.toDateString() === new Date(selectedDate).toDateString()
        : false;
      const isDisabled =
        (!allowCurrentDay && date < todayInTimezone) ||
        (minDate ? date < new Date(minDate) : false) ||
        (maxDate ? date > new Date(maxDate) : false);

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled,
      });
    }

    return days;
  }, [currentMonth, selectedDate, minDate, maxDate, timezone, allowCurrentDay]);

  const calendarDays = generateCalendarDays();

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      setSelectedDate(dateString);

      // Only call onChange if autoUpdate is enabled
      if (selectedTime && autoUpdate) {
        const utcValue = convertToUTC(dateString, selectedTime);
        onChange(utcValue);
      }
    },
    [selectedTime, convertToUTC, onChange, autoUpdate]
  );

  // Handle time selection
  const handleTimeSelect = useCallback(
    (time: string) => {
      setSelectedTime(time);

      // Only call onChange if autoUpdate is enabled
      if (selectedDate && autoUpdate) {
        const utcValue = convertToUTC(selectedDate, time);
        onChange(utcValue);
      }
    },
    [selectedDate, convertToUTC, onChange, autoUpdate]
  );

  // Navigate calendar months
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  // Get current Bahrain time
  const getCurrentBahrainTime = useCallback(() => {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [timezone]);

  const currentBahrainTime = getCurrentBahrainTime();

  // Method to get current selected value (for manual updates)
  const getCurrentValue = useCallback(() => {
    if (selectedDate && selectedTime) {
      return convertToUTC(selectedDate, selectedTime);
    }
    return value;
  }, [selectedDate, selectedTime, convertToUTC, value]);

  // Expose getCurrentValue to parent component
  useEffect(() => {
    if (onValueChange) {
      onValueChange(getCurrentValue);
    }
  }, [onValueChange, getCurrentValue]);

  return (
    <div className={`relative ${className}`}>
      <label className='block text-sm font-medium text-gray-700 mb-2'>
        {label}
        {showTimezone && (
          <span className='text-xs text-gray-500 ml-2'>
            ({timezone.replace('Asia/', '')} Time)
          </span>
        )}
      </label>

      <div className='relative'>
        <button
          type='button'
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-left border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${
              error
                ? 'border-red-300 text-red-900 placeholder-red-300'
                : warning
                  ? 'border-yellow-300 text-yellow-900'
                  : 'border-gray-300 text-gray-900'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
          `}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Calendar className='w-4 h-4 text-gray-400' />
              <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                {value
                  ? convertFromUTC(value).date +
                    ' ' +
                    convertFromUTC(value).time
                  : placeholder}
              </span>
            </div>
            <Clock className='w-4 h-4 text-gray-400' />
          </div>
        </button>

        {/* Current time indicator */}
        <div className='absolute top-full left-0 mt-1 text-xs text-gray-500'>
          Current: {currentBahrainTime}
        </div>
      </div>

      {/* Error/Warning messages */}
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      {warning && (
        <p className='mt-1 text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200'>
          ⚠️ {warning}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className='absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50'>
          <div className='p-4'>
            {/* Calendar */}
            <div className='mb-4'>
              <div className='flex items-center justify-between mb-2'>
                <button
                  onClick={() => navigateMonth('prev')}
                  className='p-1 hover:bg-gray-100 rounded'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                </button>
                <h3 className='text-sm font-medium text-gray-900'>
                  {currentMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className='p-1 hover:bg-gray-100 rounded'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
              </div>

              <div className='grid grid-cols-7 gap-1 text-xs'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className='p-2 text-center text-gray-500 font-medium'
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      !day.isDisabled && handleDateSelect(day.date)
                    }
                    disabled={day.isDisabled}
                    className={`
                      p-2 text-center rounded text-xs
                      ${
                        day.isDisabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : day.isSelected
                            ? 'bg-blue-600 text-white'
                            : day.isToday
                              ? 'bg-blue-100 text-blue-900'
                              : day.isCurrentMonth
                                ? 'text-gray-900 hover:bg-gray-100'
                                : 'text-gray-400'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <h4 className='text-sm font-medium text-gray-900 mb-2'>
                Select Time
              </h4>
              <div className='grid grid-cols-2 gap-2 max-h-48 overflow-y-auto'>
                {timeSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => handleTimeSelect(slot.startTime)}
                    className={`
                      p-2 text-xs text-center rounded border
                      ${
                        selectedTime === slot.startTime
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    {slot.displayTime}
                  </button>
                ))}
              </div>
            </div>

            {/* Close button */}
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <button
                onClick={() => setIsOpen(false)}
                className='w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
