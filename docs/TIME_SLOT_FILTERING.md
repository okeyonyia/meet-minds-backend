# Time Slot Filtering

The Meet Minds backend now supports filtering events and personal dining experiences by time slots to help users find activities during their preferred times of day.

## Available Time Slots

- **`morning`**: 5:00 AM - 11:59 AM
- **`afternoon`**: 12:00 PM - 5:59 PM  
- **`night`**: 6:00 PM - 4:59 AM (wraps around midnight)

## Usage

### 1. Filter Events by Time Slot

**GET** `/event?time_slot=morning`

Query Parameters:
- `time_slot` (optional): `morning`, `afternoon`, or `night`
- All existing filters still work (page, limit, text, date, capacity, etc.)

Examples:
```bash
# Get morning events
GET /event?time_slot=morning

# Get afternoon events with pagination
GET /event?time_slot=afternoon&page=1&limit=20

# Get night events for a specific date
GET /event?time_slot=night&date=2025-01-15

# Combine with text search
GET /event?time_slot=morning&text=brunch
```

### 2. Filter Personal Dining Experiences by Time Slot

**GET** `/personal-dining/public?time_slot=evening`

Query Parameters:
- `time_slot` (optional): `morning`, `afternoon`, or `night`
- `latitude` (optional): User's latitude for location filtering
- `longitude` (optional): User's longitude for location filtering
- `radius` (optional): Search radius in kilometers

Examples:
```bash
# Get public personal dining experiences for morning
GET /personal-dining/public?time_slot=morning

# Get afternoon dining experiences near a location
GET /personal-dining/public?time_slot=afternoon&latitude=40.7128&longitude=-74.0060&radius=10

# Get night dining experiences
GET /personal-dining/public?time_slot=night
```

## Time Slot Logic

The system determines time slots based on the `start_time` field for events and `dining_time` field for personal dining experiences.

### Morning (5:00 AM - 11:59 AM)
Perfect for:
- Breakfast meetings
- Brunch events
- Morning coffee meetups
- Early networking sessions

### Afternoon (12:00 PM - 5:59 PM)
Ideal for:
- Lunch experiences
- Afternoon tea
- Business dining
- Weekend meetups

### Night (6:00 PM - 4:59 AM)
Great for:
- Dinner events
- Late night dining
- Social gatherings
- Evening entertainment

## Response Format

The API returns the same response structure as before, but filtered by time slot:

```json
{
  "statusCode": 200,
  "message": "Events retrieved successfully",
  "data": [
    {
      "_id": "event_id",
      "title": "Morning Networking Brunch",
      "start_time": "09:30",
      "start_date": "2025-01-15T00:00:00.000Z",
      // ... other event fields
    }
  ],
  "totalCount": 15
}
```

## Integration with Existing Filters

Time slot filtering works seamlessly with all existing filters:

```bash
# Complex filter example
GET /event?time_slot=night&text=italian&capacity=4&date=2025-01&page=1&limit=10
```

This would find:
- Night time events (6:00 PM - 4:59 AM)
- Containing "italian" in title/description
- With capacity for at least 4 people
- Scheduled for January 2025
- Return first 10 results

## Backend Implementation Details

The filtering uses MongoDB aggregation to efficiently filter times:

- **Morning & Afternoon**: Direct hour range comparison
- **Night**: Uses `$or` condition to handle midnight wraparound
- **Performance**: Indexed on time fields for fast queries
- **Validation**: Only accepts valid enum values (`morning`, `afternoon`, `night`)

## Error Handling

Invalid time slot values are ignored (no error thrown), so the query returns all time slots if an invalid value is provided.

Valid values: `morning`, `afternoon`, `night`
Invalid values: `evening`, `dawn`, `lunch`, etc. (silently ignored)
