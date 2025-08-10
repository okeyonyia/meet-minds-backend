# Meet Minds Backend API Documentation Summary

This document provides an overview of the comprehensive Swagger/OpenAPI documentation for the Meet Minds dining platform, which includes both Personal Dining and Group Events systems.

## 📋 Overview

The Meet Minds platform provides two distinct dining experiences:

### 🍽️ Personal Dining (One-on-One)
- **Private intimate dining** between two people
- **Always private** - never appears on public maps
- **Commission-based** pricing with 10% discount split
- **Direct invitation** only

### 🎉 Events (Group Dining)
- **Group social dining** for multiple attendees  
- **Public visibility** with Google Maps integration
- **Ticket-based** pricing system
- **AI-powered suggestions** and public discovery

## 🏢 Restaurant API (`/restaurant`)

### Endpoints with Swagger Documentation:

#### **POST** `/restaurant`
- **Summary**: Create a new restaurant
- **Description**: Creates a new restaurant with location, cuisine types, opening hours, and commission settings
- **Security**: Bearer Token Required
- **Responses**: 201 (success), 400 (validation error)

#### **GET** `/restaurant`
- **Summary**: Get all restaurants with filtering
- **Description**: Retrieves restaurants with optional filtering by cuisine, price range, location, etc.
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 10)
  - `cuisine_types`: Comma-separated cuisine types
  - `price_range`: Maximum price range (1-5)
  - `min_rating`: Minimum rating filter (0-5)
  - `search`: Search in name, description, cuisine
  - `latitude`/`longitude`: Location-based filtering
  - `radius`: Search radius in kilometers

#### **GET** `/restaurant/nearby`
- **Summary**: Find nearby restaurants
- **Description**: Get restaurants within a specified radius of given coordinates
- **Query Parameters**: `latitude`* (required), `longitude`* (required), `radius` (optional, default: 10km)

#### **GET** `/restaurant/map`
- **Summary**: Get restaurants for map display
- **Description**: Retrieves only restaurants with active dining experiences for Google Maps display
- **Query Parameters**: Location coordinates and radius for map bounds

#### **GET** `/restaurant/:id`
- **Summary**: Get restaurant by ID
- **Description**: Retrieves a single restaurant with all details including active dining experiences

#### **PATCH** `/restaurant/:id`
- **Summary**: Update restaurant
- **Description**: Updates restaurant information including hours, menu, and commission settings
- **Security**: Bearer Token Required

#### **DELETE** `/restaurant/:id`
- **Summary**: Delete restaurant
- **Description**: Deactivates a restaurant (soft delete)
- **Security**: Bearer Token Required

#### **POST** `/restaurant/:id/review`
- **Summary**: Add restaurant review
- **Description**: Adds a review and rating for a restaurant, optionally linked to a dining experience
- **Security**: Bearer Token Required
- **Request Body**: `reviewer_id`, `rating` (1-5), `review` (optional), `dining_experience_id` (optional)

---

## 🍽️ Personal Dining API (`/personal-dining`)

### Private One-on-One Dining Endpoints:

#### **POST** `/personal-dining`
- **Summary**: Create a new personal dining experience
- **Description**: Creates a private one-on-one dining experience (never appears on public maps)
- **Security**: Bearer Token Required
- **Responses**: 201 (success), 400 (validation error)
- **Note**: Always private with `is_visible_on_map: false`

#### **GET** `/personal-dining/user/:userId`
- **Summary**: Get user's personal dining experiences
- **Description**: Retrieves all personal dining experiences for a specific user
- **Query Parameters**:
  - `status`: Filter by experience status (pending, accepted, declined, completed, cancelled)
  - `asHost`: Include experiences where user is host (boolean)
  - `asGuest`: Include experiences where user is guest (boolean)

#### **GET** `/personal-dining/:id`
- **Summary**: Get personal dining experience by ID
- **Description**: Retrieves a single personal dining experience with full details
- **Responses**: 200 (success), 404 (not found)

#### **PATCH** `/personal-dining/:id/respond`
- **Summary**: Respond to personal dining invitation
- **Description**: Accept or decline a personal dining invitation
- **Security**: Bearer Token Required
- **Request Body**: `guest_id`, `response` (accept/decline), `message` (optional)

#### **PATCH** `/personal-dining/:id/cancel`
- **Summary**: Cancel personal dining experience
- **Description**: Cancel a pending or confirmed personal dining experience
- **Security**: Bearer Token Required
- **Request Body**: `user_id`, `reason` (optional)

#### **PATCH** `/personal-dining/complete`
- **Summary**: Complete personal dining experience
- **Description**: Mark as completed with 5% commission and 5% discount calculations
- **Security**: Bearer Token Required
- **Request Body**: `personal_dining_id`, `total_bill_amount`

#### **POST** `/personal-dining/review`
- **Summary**: Add review for personal dining
- **Description**: Host or guest can review the experience and restaurant
- **Security**: Bearer Token Required
- **Request Body**: `reviewer_id`, `personal_dining_id`, `rating`, `comment`

---

## 🎉 Events API (`/event`)

### Group Dining Events Endpoints:

#### **POST** `/event`
- **Summary**: Create new group event
- **Description**: Create a group dining event with configurable capacity and public visibility
- **Security**: Bearer Token Required
- **Responses**: 201 (success), 400 (validation error)

#### **GET** `/event`
- **Summary**: Get all events with filtering
- **Description**: Retrieve events with advanced filtering and pagination
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Results per page
  - `text`: Search across all text fields
  - `capacity`: Minimum capacity
  - `date`: Filter by date (YYYY, YYYY-MM, YYYY-MM-DD)
  - `event_type`: Filter by event type

#### **POST** `/event/suggest-event`
- **Summary**: Get AI-powered event suggestions
- **Description**: Find best matching events based on user preferences and availability
- **Request Body**: `profile_id`, `available_from`, `available_to`
- **AI Features**: Interest matching, location scoring, time overlap analysis

#### **GET** `/event/:id`
- **Summary**: Get event by ID
- **Description**: Retrieve specific event with attendees and details
- **Responses**: 200 (success), 404 (not found)

#### **GET** `/event/id/:userId`
- **Summary**: Get user's events
- **Description**: Get events where user is hosting or attending
- **Query Parameters**: `hosting` (boolean), `attending` (boolean)

#### **GET** `/event/attendees/:id`
- **Summary**: Get event attendees
- **Description**: Retrieve all attendees for a specific event

#### **PATCH** `/event/join`
- **Summary**: Join event
- **Description**: Join an existing event as an attendee
- **Security**: Bearer Token Required
- **Request Body**: `eventId`, `profileId`

#### **PATCH** `/event/unjoin/:eventId/:userId`
- **Summary**: Leave event
- **Description**: Leave an event that user previously joined
- **Security**: Bearer Token Required

#### **PATCH** `/event/review`
- **Summary**: Add event review
- **Description**: Add review for completed event (only for attendees)
- **Security**: Bearer Token Required
- **Request Body**: `event_id`, `profile_id`, `rating`, `review`

#### **GET** `/event/reviews/:id`
- **Summary**: Get event reviews
- **Description**: Get reviews for events hosted by user
- **Query Parameters**: `top` (limit number of reviews)

#### **PATCH** `/event/:id`
- **Summary**: Update event
- **Description**: Update event details (with map visibility management)
- **Security**: Bearer Token Required

#### **DELETE** `/event/:id`
- **Summary**: Delete event
- **Description**: Delete event (removes from restaurant's active list)
- **Security**: Bearer Token Required

---

## 📝 Data Transfer Objects (DTOs)

### Restaurant DTOs:

#### **CreateRestaurantDto**
- Comprehensive validation for restaurant creation
- Includes location, opening hours, cuisine types, commission settings
- All fields documented with examples and validation rules

#### **UpdateRestaurantDto**
- Extends CreateRestaurantDto as partial type
- All fields optional for flexible updates

### Personal Dining DTOs:

#### **CreatePersonalDiningDto**
- Complete validation for private dining creation
- Date/time validation, duration limits (30-300 mins)
- Cost estimation and host payment options
- Tags and special requests handling
- Always private (never public)

#### **RespondToPersonalDiningDto**
- Guest response handling (accept/decline)
- Optional personalized message
- Expiration checking for invitations

#### **ReviewPersonalDiningDto**
- Dual review system (host + guest)
- Restaurant rating integration
- Rating validation (1-5 scale)

#### **CompletePersonalDiningDto**
- Commission calculation (5% platform + 5% discount)
- Total bill amount processing
- Payment completion handling

### Event DTOs:

#### **CreateEventDto**
- Group event creation validation
- Capacity management (attendees + slots)
- Public/private visibility settings
- Location coordinates for map display
- Ticket pricing and event duration

#### **JoinEventDto**
- Event joining validation
- Profile and event ID requirements
- Capacity checking integration

#### **CreateEventReviewDto**
- Post-event review system
- Attendee validation requirements
- Event completion checking

#### **SuggestEventDto**
- AI matching preferences
- Availability window specification
- Interest and goal compatibility

---

## 🔒 Security Features

- **Bearer Token Authentication**: All write operations require authentication
- **Role-based Access**: Proper validation for host/guest operations
- **Input Validation**: Comprehensive DTO validation with class-validator
- **Rate Limiting**: Ready for rate limiting implementation

## 📊 Response Format

All API endpoints follow a consistent response format:
```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": { ... },
  "totalCount": 123 // For paginated responses
}
```

## 🗺️ Map Integration Features

### Public Events Only:
- **Only public group events** appear on Google Maps
- **Personal dining is always private** (never on maps)
- Location-based restaurant discovery with active events
- Radius-based filtering for performance
- Real-time map updates for event creation/completion

## 💰 Dual Payment Systems

### Personal Dining (Commission-Based):
- **10% total benefit split**: 5% platform commission + 5% diner discount
- Applied to final bill amount
- Automatic calculation on completion

### Events (Ticket-Based):
- **Fixed ticket pricing** set by event host
- **Capacity management** with slots tracking
- **Payment processing** for event tickets

## 📱 Frontend Integration Ready

- **Dual system support**: Clear separation between personal and group dining
- **Complete Swagger documentation** for both dining types
- **Consistent API patterns** following REST conventions
- **Comprehensive error handling** and response codes
- **Privacy-aware design**: Personal dining never exposed publicly
- **AI integration ready** for event suggestions
- **Code generation compatible** with modern tools

---

## 🎯 Key Architectural Benefits

### Clear System Separation:
- **Personal Dining**: Private, intimate, commission-based
- **Events**: Social, discoverable, ticket-based
- **Shared Restaurant Foundation**: Both systems integrate seamlessly

### Scalable & Privacy-Focused:
- **Map performance optimized** (only public events displayed)
- **User privacy maintained** (personal dining always private)
- **AI-enhanced discovery** for group events
- **Flexible pricing models** for different dining types

## 🚀 Next Steps

1. **Testing**: Comprehensive unit and integration tests for both systems
2. **Business Logic**: Restaurant availability, time slots, capacity management
3. **Payment Integration**: Connect with processors for both commission and ticket-based flows
4. **Real-time Features**: Notifications for invitations, event updates, AI suggestions
5. **Analytics & Insights**: Track performance across both personal and group dining
6. **Mobile Optimization**: Ensure optimal performance for map-based discovery
7. **AI Enhancement**: Improve event suggestion algorithms with user feedback

This comprehensive API documentation provides a robust foundation for the Meet Minds dual dining platform, supporting both intimate personal experiences and vibrant community events with clear architectural boundaries and developer-friendly integration.
