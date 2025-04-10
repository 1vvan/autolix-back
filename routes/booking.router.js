const Router = require('express');
const bookingController = require('../controllers/booking.controller');
const router = new Router();

router.post("/bookings", bookingController.addBooking);

router.put("/bookings/:id/date", bookingController.updateBookingDateTime);
router.put("/bookings/:id/cancel", bookingController.cancelBooking);
router.get('/bookings/:phone/appointments', bookingController.getClientAppointments)

router.get("/bookings/services", bookingController.getAllServices);
router.get("/bookings/busy-slots", bookingController.getBookedSlotsByDate);

module.exports = router;