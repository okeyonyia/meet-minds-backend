/**
 * Example script demonstrating how to use the bulk restaurant creation API
 * This script shows how to create 50-100 restaurants at once using the API
 */

// Sample restaurant data template
const generateSampleRestaurants = (count) => {
  const cuisineTypes = [
    ['Italian', 'Mediterranean'],
    ['Chinese', 'Asian'],
    ['Indian', 'Asian'],
    ['Mexican', 'Latin American'],
    ['Japanese', 'Asian'],
    ['French', 'European'],
    ['Nigerian', 'African'],
    ['Lebanese', 'Middle Eastern'],
    ['Thai', 'Asian'],
    ['American', 'Fast Food']
  ];

  const amenities = [
    ['WiFi', 'Parking', 'Outdoor Seating'],
    ['Live Music', 'Bar', 'Delivery'],
    ['Takeaway', 'Air Conditioning', 'Private Dining'],
    ['Valet Parking', 'Kids Menu', 'Vegetarian Options'],
    ['Credit Cards Accepted', 'Reservations Required']
  ];

  const restaurants = [];

  for (let i = 0; i < count; i++) {
    const randomCuisine = cuisineTypes[Math.floor(Math.random() * cuisineTypes.length)];
    const randomAmenities = amenities[Math.floor(Math.random() * amenities.length)];
    const priceRange = Math.floor(Math.random() * 5) + 1;
    
    // Random Lagos coordinates (approximately within Lagos bounds)
    const baseLat = 6.5244;
    const baseLng = 3.3792;
    const latitude = baseLat + (Math.random() - 0.5) * 0.5;
    const longitude = baseLng + (Math.random() - 0.5) * 0.5;

    restaurants.push({
      name: `Restaurant ${i + 1} - ${randomCuisine[0]} Haven`,
      description: `Authentic ${randomCuisine[0]} cuisine with modern twists and traditional flavors. Perfect for family dining and special occasions.`,
      images: [
        `https://example.com/restaurant-${i + 1}-1.jpg`,
        `https://example.com/restaurant-${i + 1}-2.jpg`
      ],
      location: {
        latitude: latitude,
        longitude: longitude,
        address: `${Math.floor(Math.random() * 100) + 1} Restaurant Street, Lagos, Nigeria`
      },
      cuisine_types: randomCuisine,
      price_range: priceRange,
      phone_number: `+234${Math.floor(Math.random() * 90000) + 7010000000}`,
      email: `info@restaurant${i + 1}.com`,
      website: `https://restaurant${i + 1}.com`,
      opening_hours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '23:00', closed: false },
        saturday: { open: '09:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '21:00', closed: false }
      },
      is_active: true,
      accepts_reservations: true,
      platform_discount_percentage: 10 + Math.floor(Math.random() * 5),
      platform_commission_percentage: 5,
      diner_discount_percentage: 5 + Math.floor(Math.random() * 3),
      amenities: randomAmenities,
      is_partner: Math.random() > 0.7
    });
  }

  return restaurants;
};

// Function to make the API call
const bulkCreateRestaurants = async (restaurants, authToken, baseUrl = 'http://localhost:3000') => {
  try {
    const response = await fetch(`${baseUrl}/restaurant/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // Admin token required
      },
      body: JSON.stringify({
        restaurants: restaurants
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating restaurants:', error);
    throw error;
  }
};

// Example usage function
const main = async () => {
  try {
    // Replace with your admin authentication token
    const adminToken = 'your_admin_jwt_token_here';
    
    // Generate 50 sample restaurants
    const restaurants = generateSampleRestaurants(50);
    
    console.log(`Generated ${restaurants.length} restaurants for bulk creation`);
    console.log('Sample restaurant:', JSON.stringify(restaurants[0], null, 2));
    
    // Make the API call
    console.log('Starting bulk restaurant creation...');
    const result = await bulkCreateRestaurants(restaurants, adminToken);
    
    console.log('Bulk creation completed!');
    console.log('Summary:', result.data.summary);
    console.log(`Successful: ${result.data.summary.successful}`);
    console.log(`Failed: ${result.data.summary.failed}`);
    
    if (result.data.failed.length > 0) {
      console.log('Failed restaurants:');
      result.data.failed.forEach(failure => {
        console.log(`Index ${failure.index}: ${failure.error}`);
      });
    }
    
  } catch (error) {
    console.error('Main execution error:', error);
  }
};

// Example using curl command (alternative to the JavaScript function)
const generateCurlExample = (restaurants) => {
  const curlCommand = `curl -X POST "http://localhost:3000/restaurant/bulk" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_admin_jwt_token_here" \\
  -d '${JSON.stringify({ restaurants: restaurants.slice(0, 3) }, null, 2)}'`;
  
  console.log('Curl command example (with first 3 restaurants):');
  console.log(curlCommand);
};

// If running this script directly
if (require.main === module) {
  // Generate sample data
  const sampleRestaurants = generateSampleRestaurants(5);
  generateCurlExample(sampleRestaurants);
  
  console.log('\\nTo run the bulk creation, uncomment the following line and add your admin token:');
  console.log('// main();');
}

module.exports = {
  generateSampleRestaurants,
  bulkCreateRestaurants
};
