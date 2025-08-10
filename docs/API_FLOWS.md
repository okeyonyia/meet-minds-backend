# Meet Minds Backend - API Flows & Features

## Overview
Meet Minds is a social dining platform that connects people through two main types of experiences:
1. **Group Events** - Public multi-attendee dining events 
2. **Personal Dining** - One-on-one private or public dining experiences

## 🎯 **Group Events Flow**

### 1. Create & Discover Events
```bash
# Create a group event
POST /event
{
  "title": "Italian Networking Dinner",
  "description": "Join us for authentic Italian cuisine",
  "restaurant_id": "restaurant_id",
  "start_date": "2025-01-20",
  "start_time": "19:00",
  "no_of_attendees": 8,
  "is_public": true
}

# Discover events with filtering
GET /event?time_slot=night&text=networking&capacity=4&page=1&limit=20
```

### 2. Join & Participate
```bash
# Join an event (immediate acceptance)
PATCH /event/join
{
  "eventId": "event_id",
  "profileId": "profile_id"
}

# Leave an event
PATCH /event/unjoin/:eventId/:userId
```

### 3. Event Lifecycle
```bash
# View event details
GET /event/:id

# Get event attendees  
GET /event/attendees/:id

# Update event (host only)
PATCH /event/:id

# Delete event (host only)
DELETE /event/:id
```

### 4. Reviews & Ratings
```bash
# Add review after completion
PATCH /event/review
{
  "event_id": "event_id",
  "profile_id": "profile_id", 
  "rating": 5,
  "review": "Amazing experience!"
}

# Get event reviews
GET /event/reviews/:id?top=5
```

---

## 💑 **Personal Dining Flow**

### 1. Direct Invitation Flow
```bash
# Create private invitation to specific person
POST /personal-dining
{
  "host_id": "host_id",
  "guest_id": "guest_id",  // Direct invitation
  "restaurant_id": "restaurant_id",
  "dining_date": "2025-01-20",
  "dining_time": "19:30",
  "is_public": false
}

# Guest responds to invitation  
PATCH /personal-dining/:id/respond
{
  "guest_id": "guest_id",
  "response": "accept"  // or "decline"
}
```

### 2. Public Personal Dining Flow
```bash
# Create public dining experience
POST /personal-dining
{
  "host_id": "host_id",
  "restaurant_id": "restaurant_id", 
  "dining_date": "2025-01-20",
  "dining_time": "19:30",
  "is_public": true,      // Public for join requests
  "expires_at": "2025-01-20T17:00:00Z"
}

# Discover public experiences with time slot filtering
GET /personal-dining/public?time_slot=night&latitude=6.5244&longitude=3.3792

# Request to join public experience
POST /personal-dining/:id/request-join
{
  "requester_id": "requester_id",
  "message": "Would love to join for dinner!"
}
```

### 3. Join Request Management
```bash
# Host views join requests
GET /personal-dining/join-requests/:hostId

# Host responds to join request
PATCH /personal-dining/:id/respond-join-request
{
  "host_id": "host_id",
  "request_id": "requester_id", 
  "response": "accept",  // or "decline"
  "response_message": "Looking forward to meeting you!"
}
```

### 4. Experience Lifecycle
```bash
# View user's dining experiences
GET /personal-dining/user/:userId?status=accepted&asHost=true

# Get experience details
GET /personal-dining/:id

# Cancel experience
PATCH /personal-dining/:id/cancel
{
  "user_id": "user_id",
  "reason": "Schedule conflict"
}

# Complete experience
PATCH /personal-dining/complete
{
  "personal_dining_id": "experience_id",
  "total_bill_amount": 120.50
}

# Add review
POST /personal-dining/review
{
  "reviewer_id": "reviewer_id",
  "personal_dining_id": "experience_id",
  "rating": 5,
  "comment": "Great conversation and food!"
}
```

---

## 🕒 **Time Slot Filtering**

Both events and personal dining support time-based filtering:

### Time Slots Available:
- **`morning`**: 5:00 AM - 11:59 AM (breakfast, brunch, coffee)
- **`afternoon`**: 12:00 PM - 5:59 PM (lunch, afternoon tea) 
- **`night`**: 6:00 PM - 4:59 AM (dinner, late night)

### Usage Examples:
```bash
# Morning events
GET /event?time_slot=morning

# Night personal dining experiences
GET /personal-dining/public?time_slot=night

# Combine with other filters
GET /event?time_slot=afternoon&text=business&capacity=6
```

---

## ⏰ **Time Conflict Prevention**

Users cannot accept/request dining experiences within **2 hours** of existing accepted experiences:

### Conflict Rules:
- 2-hour buffer before and after any accepted experience
- Applies to both direct invitations and join requests
- Prevents double-booking and ensures travel time
- Users can accept new experiences 3+ hours after existing ones end

### Example:
✅ **Allowed**: User has dinner 6-8 PM, can accept lunch starting at 11 AM next day  
❌ **Blocked**: User has dinner 6-8 PM, cannot accept another dinner at 9:30 PM  
✅ **Allowed**: User has dinner 6-8 PM, can accept late dinner starting at 11 PM

---

## 🔍 **Advanced Filtering & Search**

### Event Filtering:
```bash
GET /event?text=networking&date=2025-01&capacity=4&time_slot=night&page=1&limit=10
```

### Personal Dining Filtering:
```bash  
GET /personal-dining/public?time_slot=afternoon&latitude=40.7128&longitude=-74.0060&radius=15
```

### User Experience Filtering:
```bash
GET /personal-dining/user/:userId?status=completed&asHost=true&asGuest=false
```

---

## 🔐 **Authentication & Authorization**

Most endpoints require authentication via Bearer token:

```bash
Authorization: Bearer <jwt_token>
```

### Public Endpoints (No Auth Required):
- `GET /event` - Browse public events
- `GET /personal-dining/public` - Browse public dining experiences
- `GET /event/:id` - View public event details
- `GET /personal-dining/:id` - View public dining details

### Protected Endpoints (Auth Required):
- All `POST`, `PATCH`, `DELETE` operations
- User-specific data endpoints
- Join/request operations
- Reviews and completions

---

## 📊 **Response Format**

All endpoints follow consistent response structure:

```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": { /* response data */ },
  "totalCount": 25  // For paginated responses
}
```

### Error Responses:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

---

## 🚀 **Key Features Summary**

### ✅ **Implemented Features:**
- [x] Group events with instant joining
- [x] Personal dining with direct invitations  
- [x] Public personal dining with join requests
- [x] Time slot filtering (morning/afternoon/night)
- [x] 2-hour conflict prevention system
- [x] Location-based filtering
- [x] Restaurant integration
- [x] Reviews & ratings system
- [x] Experience lifecycle management
- [x] Comprehensive Swagger documentation

### 🎯 **User Journey Examples:**

#### **Scenario 1: Group Event**
1. User creates "Friday Night Sushi" event at restaurant
2. Other users discover via `/event?time_slot=night&text=sushi`
3. Users join instantly (no approval needed)
4. Event occurs, users leave reviews

#### **Scenario 2: Direct Personal Dining**  
1. User A views User B's profile, likes them
2. User A creates personal dining invitation for User B
3. User B accepts invitation
4. They dine together, both leave reviews

#### **Scenario 3: Public Personal Dining**
1. User creates public dining experience for Saturday brunch
2. Others discover via `/personal-dining/public?time_slot=morning`  
3. Interested user sends join request with message
4. Host accepts request, experience becomes private
5. They meet for brunch, exchange reviews

This architecture provides flexible social dining experiences while maintaining proper conflict prevention and user safety measures.
