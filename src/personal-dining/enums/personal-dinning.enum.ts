export enum ResponseType {
  ACCEPT = 'accept',
  DECLINE = 'decline',
}

export enum DiningStatus {
  PENDING = 'pending', // Created, waiting for guest response
  ACCEPTED = 'accepted', // Guest accepted, restaurant booked
  DECLINED = 'declined', // Guest declined
  CONFIRMED = 'confirmed', // Both parties confirmed, payment processed
  COMPLETED = 'completed', // Dining experience finished
  CANCELLED = 'cancelled', // Cancelled by either party
}
