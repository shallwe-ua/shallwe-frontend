import React, { useState, useEffect } from 'react'
import { isBefore, isAfter, parseISO } from 'date-fns'


interface BirthDateSelectProps {
  inputId: string
  currentValue: string | null // Expecting YYYY-MM-DD string or null
  onChange: (dateString: string) => void // Expecting a valid YYYY-MM-DD string (never null from this component)
  error?: string
  className?: string
}


const BirthDateSelect: React.FC<BirthDateSelectProps> = ({
  inputId,
  currentValue,
  onChange,
  error,
  className = ''
}) => {
  // State for individual date components (always strings, representing valid numbers or empty initially)
  const [day, setDay] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>('')
  
  // State to track if date is selected
  const [isInitiated, setIsInitiated] = useState<boolean>(currentValue !== null)

  // Age limits as dates - calculated precisely
  const currentDate = new Date() // Use current date for calculations
  // Calculate exact dates 120 and 16 years ago
  const minSelectableDate = new Date(currentDate.getFullYear() - 120, currentDate.getMonth(), currentDate.getDate())
  const maxSelectableDate = new Date(currentDate.getFullYear() - 16, currentDate.getMonth(), currentDate.getDate())

  // Generate options based on min/max dates
  const minYear = minSelectableDate.getFullYear()
  const maxYear = maxSelectableDate.getFullYear()
  const monthOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => (maxYear - i).toString())

  // Populate state from currentValue when it changes
  useEffect(() => {
    if (currentValue) {
      try {
        // Parse the input string into a Date object
        const inputDate = parseISO(currentValue) // Handles YYYY-MM-DD format
        // Validate if the date is within the allowed range
        if (isBefore(inputDate, minSelectableDate)) {
             console.warn("BirthDateSelect: currentValue too old (before minSelectableDate):", currentValue, "Min:", minSelectableDate.toISOString().split('T')[0])
             setToMinDate() // Set to the minimum allowed date if too old
             setIsInitiated(true)
             return // Exit early after setting default
        }
        else if (isAfter(inputDate, maxSelectableDate)) {
             console.warn("BirthDateSelect: currentValue too young (after maxSelectableDate):", currentValue, "Max:", maxSelectableDate.toISOString().split('T')[0])
             setToMaxDate() // Set to the maximum allowed date if too young
             setIsInitiated(true)
             return // Exit early after setting default
        }

        // If within range, update state
        const y = inputDate.getFullYear().toString()
        const m = (inputDate.getMonth() + 1).toString().padStart(2, '0') // getMonth is 0-indexed
        const d = inputDate.getDate().toString().padStart(2, '0')

        // Ensure year is within the dynamic range (double-check after parsing)
        if (Number(y) >= minYear && Number(y) <= maxYear) {
            // Check if day is valid for the given month/year, adjust if necessary
            const maxDayForDate = new Date(Number(y), Number(m), 0).getDate()
            const finalDay = Math.min(Number(d), maxDayForDate).toString().padStart(2, '0')
            setYear(y)
            setMonth(m)
            setDay(finalDay)
            setIsInitiated(true)
        } else {
             console.warn("BirthDateSelect: Parsed year out of range:", y, "Expected between", minYear, "and", maxYear)
             setToMaxDate() // Default to max if parsing results in out-of-range year
             setIsInitiated(true)
        }

      } catch (e) {
        console.warn("BirthDateSelect: Invalid currentValue format or parsing error:", currentValue, e)
        // Set to the maximum allowed date if format is invalid or parsing fails
        setToMaxDate()
        setIsInitiated(true)
      }
    }
    else {
      setDay('')
      setMonth('')
      setYear('')
      setIsInitiated(false)
    }

    function setToMinDate() {
         const defaultYear = minSelectableDate.getFullYear().toString()
         const defaultMonth = (minSelectableDate.getMonth() + 1).toString().padStart(2, '0') // getMonth is 0-indexed
         const defaultDay = minSelectableDate.getDate().toString().padStart(2, '0')
         setYear(defaultYear)
         setMonth(defaultMonth)
         setDay(defaultDay)
    }

    function setToMaxDate() {
        const defaultYear = maxSelectableDate.getFullYear().toString()
        const defaultMonth = (maxSelectableDate.getMonth() + 1).toString().padStart(2, '0') // getMonth is 0-indexed
        const defaultDay = maxSelectableDate.getDate().toString().padStart(2, '0')
        setYear(defaultYear)
        setMonth(defaultMonth)
        setDay(defaultDay)
    }
  }, [currentValue, minSelectableDate, maxSelectableDate])


  // --- Calculate days based on selected month and year ---
  const daysInMonth = month && year ? new Date(Number(year), Number(month), 0).getDate() : 31 // Month is 1-indexed for getDate, 0 gets last day of prev month
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'))

  // Handle change for any select
  const handleSelectChange = (part: 'day' | 'month' | 'year', value: string) => {
    // Update the specific part's state
    let newDay = day
    let newMonth = month
    let newYear = year

    if (part === 'day') newDay = value
    if (part === 'month') newMonth = value
    if (part === 'year') newYear = value

    // If month or year changed, check if the current day is still valid for the new month/year
    if ((part === 'month' || part === 'year') && newMonth && newYear) {
        const maxDayForNewMonth = new Date(Number(newYear), Number(newMonth), 0).getDate()
        // If the currently selected day is too high for the new month/year, adjust it to the maximum allowed
        if (newDay && Number(newDay) > maxDayForNewMonth) {
            newDay = maxDayForNewMonth.toString().padStart(2, '0')
        }
    }

    // If day changed, check if it's valid for the current month/year, adjust if necessary
    if (part === 'day' && newDay && newMonth && newYear) {
        const maxDayForCurrentMonth = new Date(Number(newYear), Number(newMonth), 0).getDate()
        if (Number(newDay) > maxDayForCurrentMonth) {
            newDay = maxDayForCurrentMonth.toString().padStart(2, '0')
        }
    }

    if (newDay && newMonth && newYear) {
      const potentialDate = new Date(Number(newYear), Number(newMonth) - 1, Number(newDay)) // Month is 0-indexed for Date constructor

      if (isBefore(potentialDate, minSelectableDate)) {
        newYear = minSelectableDate.getFullYear().toString()
        newMonth = (minSelectableDate.getMonth() + 1).toString().padStart(2, '0')
        newDay = minSelectableDate.getDate().toString().padStart(2, '0')
      }
      else if (isAfter(potentialDate, maxSelectableDate)) {
        newYear = maxSelectableDate.getFullYear().toString()
        newMonth = (maxSelectableDate.getMonth() + 1).toString().padStart(2, '0')
        newDay = maxSelectableDate.getDate().toString().padStart(2, '0')
      }
    }
    else {
      console.warn("BirthDateSelect: handleSelectChange received empty part, state might be inconsistent.", {part, value, newDay, newMonth, newYear})
    }


    // Update state with potentially adjusted values
    setDay(newDay)
    setMonth(newMonth)
    setYear(newYear)
    setIsInitiated(true)

    // Construct the final date string after all validations and adjustments
    // All parts should be non-empty strings representing valid numbers due to select options and adjustment logic
    if (newDay && newMonth && newYear) {
      const finalDateString = `${newYear}-${newMonth}-${newDay}`
      console.log("BirthDateSelect: Sending adjusted/valid date to parent:", finalDateString)
      onChange(finalDateString) // Always send a valid date string to the parent
    } else {
        // This 'else' block should theoretically never be reached if all logic is correct
        // and select options are properly managed, as state should always hold valid parts.
        // If it somehow happens, send the previous valid date or handle appropriately.
        console.warn("BirthDateSelect: Attempted to send an incomplete date string after adjustments. State might be inconsistent.", {newDay, newMonth, newYear})
    }
  }

  // Handle clicking the select date button
  const handleSelectDateClick = () => {
    // Set to the maximum selectable date (16 years ago) when user clicks the button
    const defaultYear = maxSelectableDate.getFullYear().toString()
    const defaultMonth = (maxSelectableDate.getMonth() + 1).toString().padStart(2, '0') // getMonth is 0-indexed
    const defaultDay = maxSelectableDate.getDate().toString().padStart(2, '0')
    setYear(defaultYear)
    setMonth(defaultMonth)
    setDay(defaultDay)
    setIsInitiated(true)
    
    // Notify parent of the selected date
    const finalDateString = `${defaultYear}-${defaultMonth}-${defaultDay}`
    console.log("BirthDateSelect: Sending initial date to parent:", finalDateString)
    onChange(finalDateString)
  }

  // Determine error state based on the parent's error and potentially internal logic if needed
  // For now, just pass through the parent's error
  const displayError = error

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        Birth Date (16-120 years old allowed)
      </label>
      <div className="flex flex-row space-x-2 mt-1">
        {!isInitiated ? (
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={handleSelectDateClick}
              className={`w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                displayError ? 'border-red-500' : ''
              } ${className}`}
            >
              Select the date
            </button>
          </div>
        ) : (
          // Show date selects when date is selected
          <>
            {/* Day Select */}
            <div className="flex flex-col"> {/* Container for Day label and select */}
              <label htmlFor={`${inputId}-day`} className="text-xs text-gray-500 mb-1">Day</label>
              <select
                id={`${inputId}-day`}
                value={day}
                onChange={(e) => handleSelectChange('day', e.target.value)}
                className={`rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  displayError ? 'border-red-500' : ''
                } ${className}`}
              >
                {dayOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Month Select */}
            <div className="flex flex-col"> {/* Container for Month label and select */}
              <label htmlFor={`${inputId}-month`} className="text-xs text-gray-500 mb-1">Month</label>
              <select
                id={`${inputId}-month`}
                value={month}
                onChange={(e) => handleSelectChange('month', e.target.value)}
                className={`rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  displayError ? 'border-red-500' : ''
                } ${className}`}
              >
                {monthOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div className="flex flex-col"> {/* Container for Year label and select */}
              <label htmlFor={`${inputId}-year`} className="text-xs text-gray-500 mb-1">Year</label>
              <select
                id={`${inputId}-year`}
                value={year}
                onChange={(e) => handleSelectChange('year', e.target.value)}
                className={`rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  displayError ? 'border-red-500' : ''
                } ${className}`}
              >
                 {yearOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                 ))}
              </select>
            </div>
          </>
        )}
      </div>
      {displayError && <p className="mt-1 text-sm text-red-600">{displayError}</p>}
    </div>
  )
}

export default BirthDateSelect
