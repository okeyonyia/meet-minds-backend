# Bulk Restaurant Creation API

This document explains how to use the bulk restaurant creation feature to add multiple restaurants (50-100) at once to your Meet Minds backend.

## Overview

The bulk restaurant creation API allows administrators to create multiple restaurants in a single request, with built-in error handling and batch processing to ensure optimal performance.

## Features

- **Batch Processing**: Restaurants are processed in batches of 10 to avoid overwhelming the database
- **Error Handling**: Individual restaurant failures don't stop the entire process
- **Detailed Response**: Get summary of successful and failed creations with error details
- **Validation**: Each restaurant is validated according to the same rules as single restaurant creation
- **Admin Only**: Requires admin authentication token

## API Endpoint

```
POST /restaurant/bulk
```

### Authentication
Requires admin privileges with Bearer token:
```
Authorization: Bearer <admin_jwt_token>
```

### Request Body

```json
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "description": "Restaurant description (min 10, max 500 chars)",
      "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "location": {
        "latitude": 6.5244,
        "longitude": 3.3792,
        "address": "123 Main Street, Lagos, Nigeria"
      },
      "cuisine_types": ["Italian", "Mediterranean"],
      "price_range": 3,
      "phone_number": "+2348012345678",
      "email": "info@restaurant.com",
      "website": "https://restaurant.com",
      "opening_hours": {
        "monday": { "open": "09:00", "close": "22:00", "closed": false },
        "tuesday": { "open": "09:00", "close": "22:00", "closed": false },
        "wednesday": { "open": "09:00", "close": "22:00", "closed": false },
        "thursday": { "open": "09:00", "close": "22:00", "closed": false },
        "friday": { "open": "09:00", "close": "22:00", "closed": false },
        "saturday": { "open": "09:00", "close": "22:00", "closed": false },
        "sunday": { "open": "09:00", "close": "22:00", "closed": false }
      },
      "is_active": true,
      "accepts_reservations": true,
      "platform_discount_percentage": 10,
      "platform_commission_percentage": 5,
      "diner_discount_percentage": 5,
      "amenities": ["WiFi", "Parking", "Outdoor Seating"],
      "is_partner": false
    }
  ]
}
```

### Response

```json
{
  "statusCode": 201,
  "message": "Bulk restaurant creation completed. 48 successful, 2 failed.",
  "data": {
    "successful": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Restaurant 1",
        // ... full restaurant object
      }
    ],
    "failed": [
      {
        "index": 5,
        "data": {
          "name": "Failed Restaurant",
          // ... original restaurant data
        },
        "error": "Validation error: phone_number is required"
      }
    ],
    "summary": {
      "total": 50,
      "successful": 48,
      "failed": 2
    }
  }
}
```

## Validation Rules

Each restaurant in the array must follow these validation rules:

### Required Fields
- `name`: String (2-100 characters)
- `description`: String (10-500 characters)
- `location`: Object with latitude, longitude, and address
- `cuisine_types`: Array of strings
- `price_range`: Number (1-5)
- `phone_number`: String
- `opening_hours`: Object with all days of the week

### Optional Fields
- `images`: Array of image URLs
- `email`: Valid email address
- `website`: URL string
- `is_active`: Boolean (default: true)
- `accepts_reservations`: Boolean (default: true)
- `platform_discount_percentage`: Number 0-100 (default: 10)
- `platform_commission_percentage`: Number 0-100 (default: 5)
- `diner_discount_percentage`: Number 0-100 (default: 5)
- `amenities`: Array of strings
- `is_partner`: Boolean (default: false)

## Limits

- **Maximum restaurants per request**: 100
- **Minimum restaurants per request**: 1
- **Batch size**: 10 restaurants processed at once
- **Request timeout**: Consider using longer timeouts for large batches

## Usage Examples

### Using curl

```bash
curl -X POST "http://localhost:3000/restaurant/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_jwt_token_here" \
  -d '{
    "restaurants": [
      {
        "name": "Sample Restaurant",
        "description": "A great place to dine with friends and family",
        "location": {
          "latitude": 6.5244,
          "longitude": 3.3792,
          "address": "123 Main Street, Lagos, Nigeria"
        },
        "cuisine_types": ["Italian", "Mediterranean"],
        "price_range": 3,
        "phone_number": "+2348012345678",
        "opening_hours": {
          "monday": { "open": "09:00", "close": "22:00" },
          "tuesday": { "open": "09:00", "close": "22:00" },
          "wednesday": { "open": "09:00", "close": "22:00" },
          "thursday": { "open": "09:00", "close": "22:00" },
          "friday": { "open": "09:00", "close": "22:00" },
          "saturday": { "open": "09:00", "close": "22:00" },
          "sunday": { "open": "09:00", "close": "22:00" }
        }
      }
    ]
  }'
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const bulkCreateRestaurants = async (restaurants, adminToken) => {
  try {
    const response = await axios.post('http://localhost:3000/restaurant/bulk', {
      restaurants: restaurants
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Success:', response.data.data.summary);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};
```

### Using Python

```python
import requests
import json

def bulk_create_restaurants(restaurants, admin_token, base_url="http://localhost:3000"):
    url = f"{base_url}/restaurant/bulk"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }
    data = {"restaurants": restaurants}
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        result = response.json()
        print(f"Success: {result['data']['summary']}")
        return result
    else:
        print(f"Error: {response.status_code} - {response.text}")
        response.raise_for_status()
```

## Best Practices

1. **Batch Size**: Don't exceed 100 restaurants per request
2. **Error Handling**: Always check the failed array in the response
3. **Validation**: Validate your data before sending to avoid unnecessary failures
4. **Retry Logic**: Implement retry logic for failed restaurants if needed
5. **Rate Limiting**: Wait between requests if making multiple bulk requests
6. **Data Quality**: Ensure unique restaurant names and accurate location data

## Error Handling

The API provides detailed error information for each failed restaurant:

- `index`: Position of the failed restaurant in your original array
- `data`: The original restaurant data that failed
- `error`: Specific error message explaining why it failed

Common errors include:
- Missing required fields
- Invalid data types
- Validation rule violations
- Database constraints (e.g., duplicate restaurant names)

## Performance Considerations

- Processing time increases with the number of restaurants
- Large batches may take several seconds to complete
- Database connections are managed automatically
- Memory usage is optimized through batch processing

## Example Script

A complete example script is available at `/examples/bulk-restaurant-creation.js` which demonstrates:
- Generating sample restaurant data
- Making the API call
- Handling the response
- Error reporting

Run the example:
```bash
node examples/bulk-restaurant-creation.js
```

## Support

For issues or questions about the bulk restaurant creation API, please check:
1. Validation error messages in failed responses
2. API documentation at `/api-docs` (Swagger)
3. Application logs for detailed error information
