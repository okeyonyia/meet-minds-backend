# Meet Minds Backend - Dining API Documentation

## Overview

The Meet Minds platform provides two distinct dining experiences:

### 🍽️ **Personal Dining** (One-on-One Intimate Dining)
- **Purpose**: Private, intimate dining experiences between two people
- **Visibility**: Always private, never appears on public maps
- **Capacity**: Fixed 2 people (host + guest)
- **Payment**: 10% discount split (5% commission + 5% diner discount)
- **Discovery**: Direct invitation only

### 🎉 **Events** (Group Social Dining)
- **Purpose**: Group dining events for multiple attendees
- **Visibility**: Can be public (appears on maps) or private
- **Capacity**: Configurable (multi-attendee with slots)
- **Payment**: Ticket-based pricing
- **Discovery**: Public search, filters, AI-powered suggestions

**Shared Features:**
- ✅ Restaurant booking integration
- ✅ Location-based functionality
- ✅ Review and rating system
- ✅ Real-time status tracking
- ✅ Google Maps integration (Events only)

---

## Restaurant Endpoints

### Base URL: `/api/v1/restaurant`

#### 1. Create Restaurant

```http
POST /api/v1/restaurant
Content-Type: application/json

{
  "name": "Bella Vista Italian Restaurant",
  "description": "Authentic Italian cuisine with a romantic atmosphere",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "address": "123 Victoria Island, Lagos, Nigeria"
  },
  "cuisine_types": ["Italian", "Mediterranean"],
  "price_range": 3,
  "phone_number": "+234901234567",
  "email": "info@bellavista.com",
  "website": "https://bellavista.com",
  "opening_hours": {
    "monday": { "open": "11:00", "close": "23:00", "closed": false },
    "tuesday": { "open": "11:00", "close": "23:00", "closed": false },
    "wednesday": { "open": "11:00", "close": "23:00", "closed": false },
    "thursday": { "open": "11:00", "close": "23:00", "closed": false },
    "friday": { "open": "11:00", "close": "23:00", "closed": false },
    "saturday": { "open": "11:00", "close": "23:00", "closed": false },
    "sunday": { "open": "12:00", "close": "22:00", "closed": false }
  },
  "amenities": ["WiFi", "Parking", "Outdoor Seating", "Live Music"],
  "is_partner": true
}
```

#### 2. Get All Restaurants (with filtering)

```http
GET /api/v1/restaurant?page=1&limit=10&cuisine_types=Italian,Chinese&price_range=3&min_rating=4.0&search=pizza&latitude=6.5244&longitude=3.3792&radius=10
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `cuisine_types`: Comma-separated cuisine types
- `price_range`: Maximum price range (1-5)
- `min_rating`: Minimum rating (0-5)
- `search`: Search in name, description, cuisine
- `latitude`: User latitude for distance filtering
- `longitude`: User longitude for distance filtering
- `radius`: Search radius in kilometers

#### 3. Get Nearby Restaurants

```http
GET /api/v1/restaurant/nearby?latitude=6.5244&longitude=3.3792&radius=10
```

#### 4. Get Restaurants for Map (with active dining experiences)

```http
GET /api/v1/restaurant/map?latitude=6.5244&longitude=3.3792&radius=50
```

**Response includes only restaurants with active dining experiences for map display**

#### 5. Get Restaurant by ID

```http
GET /api/v1/restaurant/{restaurantId}
```

#### 6. Add Restaurant Review

```http
POST /api/v1/restaurant/{restaurantId}/review
Content-Type: application/json

{
  "reviewer_id": "profile_id",
  "rating": 5,
  "review": "Amazing food and service!",
  "dining_experience_id": "optional_dining_experience_id"
}
```

---

## 🍽️ Personal Dining Endpoints (One-on-One)

### Base URL: `/api/v1/personal-dining`

#### 1. Create Personal Dining Experience

```http
POST /api/v1/personal-dining
Content-Type: application/json
Authorization: Bearer {token}

{
  "host_id": "host_profile_id",
  "guest_id": "guest_profile_id", // Optional for direct invitation
  "restaurant_id": "restaurant_id",
  "title": "Romantic Dinner",
  "description": "Looking for someone to share a lovely Italian dinner",
  "dining_date": "2025-01-15T00:00:00.000Z",
  "dining_time": "19:30",
  "estimated_duration": 120,
  "special_requests": "Window seat preferred, vegetarian options",
  "invitation_message": "Would love to have dinner with someone special!",
  "estimated_cost_per_person": 15000,
  "host_pays_all": false,
  "tags": ["romantic", "casual", "first-date"]
}
```

**Note**: Personal dining is ALWAYS private (`is_visible_on_map: false`) and never appears in public listings.

#### 2. Get User's Personal Dining Experiences

```http
GET /api/v1/personal-dining/user/{userId}?status=pending&asHost=true&asGuest=true
```

**Query Parameters:**
- `status`: Filter by status (pending, accepted, declined, confirmed, completed, cancelled)
- `asHost`: Include experiences where user is host (boolean)
- `asGuest`: Include experiences where user is guest (boolean)

#### 3. Get Personal Dining Experience Details

```http
GET /api/v1/personal-dining/{experienceId}
```

#### 4. Respond to Personal Dining Invitation

```http
PATCH /api/v1/personal-dining/{experienceId}/respond
Content-Type: application/json
Authorization: Bearer {token}

{
  "guest_id": "guest_profile_id",
  "response": "accept", // "accept" or "decline"
  "message": "I'd love to join you for dinner!"
}
```

#### 5. Cancel Personal Dining Experience

```http
PATCH /api/v1/personal-dining/{experienceId}/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
  "user_id": "user_profile_id",
  "reason": "Something came up, sorry!"
}
```

#### 6. Complete Personal Dining Experience

```http
PATCH /api/v1/personal-dining/complete
Content-Type: application/json
Authorization: Bearer {token}

{
  "personal_dining_id": "experience_id",
  "total_bill_amount": 45000
}
```

**Response includes 5% commission and 5% discount calculations**

#### 7. Add Review for Personal Dining

```http
POST /api/v1/personal-dining/review
Content-Type: application/json
Authorization: Bearer {token}

{
  "reviewer_id": "user_profile_id",
  "personal_dining_id": "experience_id",
  "rating": 5,
  "comment": "Great company and amazing food!"
}
```

---

## 🎉 Events Endpoints (Group Dining)

### Base URL: `/api/v1/event`

#### 1. Create Event

```http
POST /api/v1/event
Content-Type: application/json
Authorization: Bearer {token}

{
  "host_id": "host_profile_id",
  "restaurant_id": "restaurant_id",
  "event_type": "dining",
  "title": "Italian Food Lovers Meetup",
  "description": "Join us for authentic Italian cuisine and great conversations",
  "start_date": "2025-01-15T19:00:00.000Z",
  "end_date": "2025-01-15T22:00:00.000Z",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "address": "123 Victoria Island, Lagos"
  },
  "cover_picture": "https://example.com/event-cover.jpg",
  "ticket_price": 5000,
  "no_of_attendees": 10,
  "is_public": true
}
```

#### 2. Get All Events (with filtering)

```http
GET /api/v1/event?page=1&limit=10&text=italian&capacity=5&date=2025-01
```

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `text`: Search across all text fields
- `capacity`: Minimum capacity
- `date`: Filter by date (YYYY, YYYY-MM, or YYYY-MM-DD)
- `event_type`: Filter by event type

#### 3. Get Event Suggestions (AI-Powered)

```http
POST /api/v1/event/suggest-event
Content-Type: application/json

{
  "profile_id": "user_profile_id",
  "available_from": "2025-01-15T18:00:00.000Z",
  "available_to": "2025-01-20T23:00:00.000Z"
}
```

**AI matches events based on user interests, goals, location, and time preferences**

#### 4. Join Event

```http
PATCH /api/v1/event/join
Content-Type: application/json
Authorization: Bearer {token}

{
  "eventId": "event_id",
  "profileId": "user_profile_id"
}
```

#### 5. Leave Event

```http
PATCH /api/v1/event/unjoin/{eventId}/{userId}
Authorization: Bearer {token}
```

#### 6. Get Event Details

```http
GET /api/v1/event/{eventId}
```

#### 7. Get User's Events

```http
GET /api/v1/event/id/{userId}?hosting=true&attending=false
```

#### 8. Get Event Attendees

```http
GET /api/v1/event/attendees/{eventId}
```

#### 9. Add Event Review

```http
PATCH /api/v1/event/review
Content-Type: application/json
Authorization: Bearer {token}

{
  "event_id": "event_id",
  "profile_id": "reviewer_profile_id",
  "rating": 5,
  "review": "Amazing event with great people!"
}
```

#### 10. Get Event Reviews

```http
GET /api/v1/event/reviews/{profileId}?top=5
```

#### 11. Update Event

```http
PATCH /api/v1/event/{eventId}
Content-Type: application/json
Authorization: Bearer {token}

// Any event fields to update
```

#### 12. Delete Event

```http
DELETE /api/v1/event/{eventId}
Authorization: Bearer {token}
```

---

## Status Flow

### Dining Experience States:

1. **PENDING** - Created, waiting for guest response
2. **ACCEPTED** - Guest accepted invitation
3. **DECLINED** - Guest declined invitation
4. **CONFIRMED** - Both parties confirmed (payment processed if required)
5. **COMPLETED** - Dining finished, ready for reviews
6. **CANCELLED** - Cancelled by either party

### Commission System:

- **Restaurant offers**: 10% discount to platform users
- **Platform gets**: 5% commission from total bill
- **Diners get**: 5% discount from total bill
- **Example**: Bill = ₦50,000
  - Platform commission: ₦2,500
  - Diner discount: ₦2,500
  - Restaurant gets: ₦47,500 (₦50,000 - ₦2,500)
  - Diners pay: ₦47,500 (₦50,000 - ₦2,500)

---

## Google Maps Integration

### Frontend Implementation:

#### 1. Display Restaurants with Active Experiences

```javascript
// Get restaurants for map display
const response = await fetch(
  '/api/v1/restaurant/map?latitude=6.5244&longitude=3.3792&radius=50',
);
const { data: restaurants } = await response.json();

// Create map markers
restaurants.forEach((restaurant) => {
  const marker = new google.maps.Marker({
    position: {
      lat: restaurant.location.latitude,
      lng: restaurant.location.longitude,
    },
    map: map,
    title: restaurant.name,
    icon: {
      url: '/icons/restaurant-with-dining.svg', // Custom icon
      scaledSize: new google.maps.Size(40, 40),
    },
  });

  // Show active experiences count
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div>
        <h3>${restaurant.name}</h3>
        <p>${restaurant.active_experiences_count} active dining experiences</p>
        <p>Distance: ${restaurant.distance_km} km</p>
      </div>
    `,
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
});
```

#### 2. Display Available Public Events (Not Personal Dining)

```javascript
// Get available public events (group dining)
const response = await fetch(
  '/api/v1/event?page=1&limit=10&is_public=true',
);
const { data: events } = await response.json();

// Display events on map
events.forEach((event) => {
  if (event.location) {
    const marker = new google.maps.Marker({
      position: {
        lat: event.location.latitude,
        lng: event.location.longitude,
      },
      map: map,
      title: event.title,
      icon: {
        url: '/icons/group-event.svg',
        scaledSize: new google.maps.Size(35, 35),
      },
    });
  }
});
```

**Important**: Personal dining experiences are NEVER displayed on maps - only public group events appear.

---

## 📊 Data Models

### Restaurant Schema:
- Basic info (name, description, images)
- Location (lat, lng, address)
- Cuisine types and price range
- Opening hours (7 days with closed flags)
- Reviews and ratings (aggregated from both personal dining and events)
- **Active public events only** (for map display)
- Partner status and amenities
- Contact info and website

### Personal Dining Schema:
- Host and guest profiles (1-on-1 only)
- Restaurant reference
- Dining details (date, time, duration 30-300 mins)
- Status tracking (pending → accepted → completed)
- Cost per person and payment info
- Dual reviews (host + guest)
- **Always private** (`is_visible_on_map: false`)
- Invitation expiration (7 days for open invites)
- Commission tracking (5% platform + 5% discount)

### Event Schema:
- Host profile and multiple attendees
- Restaurant reference
- Event details (start/end dates, type, cover picture)
- Capacity management (no_of_attendees, slots)
- Public/private visibility toggle
- Ticket pricing
- Location coordinates (for map display)
- Multiple reviews from attendees
- AI suggestion compatibility
- Visibility and expiration settings

---

## Error Handling

### Common Error Responses:

#### 400 Bad Request:

```json
{
  "statusCode": 400,
  "message": "Dining date must be in the future"
}
```

#### 404 Not Found:

```json
{
  "statusCode": 404,
  "message": "Restaurant not found"
}
```

#### 403 Forbidden:

```json
{
  "statusCode": 403,
  "message": "You are not the invited guest"
}
```

---

## 🔄 Usage Examples

### 🍽️ Personal Dining Workflows:

#### 1. Direct Personal Dining Invitation:
1. User A selects a restaurant and specific guest (User B)
2. Creates **private** personal dining experience with direct invitation
3. User B receives notification (NOT visible on any public maps)
4. User B accepts/declines through personal notification
5. If accepted, both parties get confirmation for private dinner
6. After dining, both can review the experience and restaurant

#### 2. Open Personal Dining Invitation:
1. User A creates personal dining with open invitation (still private)
2. Invitation is shared through direct messaging or profile viewing
3. Other users can respond to accept the invitation
4. First to accept becomes the guest, invitation closes
5. Both parties meet for private dining experience

### 🎉 Group Events Workflows:

#### 1. Public Group Event Creation:
1. User creates public group event at restaurant
2. Event appears on Google Maps at restaurant location
3. Other users discover through map browsing or search
4. Multiple users can join until capacity is reached
5. Group meets for dining event with multiple attendees

#### 2. AI-Powered Event Suggestions:
1. User provides availability window and preferences
2. AI analyzes user interests, goals, and location
3. System suggests compatible events with scoring
4. User can join suggested events that match their preferences

### 🗺️ Map Display Logic:

#### Restaurant Markers Show:
- **Only restaurants with active PUBLIC events** (group dining)
- Number of active public events at each restaurant
- Distance from user location
- Restaurant rating and cuisine type

#### What's NOT Shown:
- **Personal dining experiences** (always private)
- Private group events
- Completed or cancelled events

#### Real-time Updates:
- New public events add restaurants to map
- Event completion removes markers if no other active events
- Event privacy changes update map visibility
- Distance-based filtering for performance

---

## 🎯 Key Architectural Benefits

### Clear Separation of Concerns:
- **Personal Dining**: Intimate, private, commission-based
- **Events**: Social, discoverable, ticket-based
- **Restaurants**: Shared foundation for both systems

### Scalable Design:
- Restaurant integration works for both dining types
- Map performance optimized (only public events)
- User privacy maintained for personal experiences
- AI suggestions enhance group event discovery

This dual-system architecture provides comprehensive dining social experiences while maintaining clear boundaries between intimate personal dining and broader community events.
