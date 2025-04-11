const { CANCELLED_BY_CLIENT_STATUS_ID } = require('../config/booking-statuses');
const pool = require('../db');

class BookingController {
    async getClientAppointments (req, res) {
        try {
            const clientPhone = req.params.phone;
            if (!clientPhone || isNaN(Number(clientPhone))) {
                return res.status(400).send("Invalid phone provided");
            }

            const queryText = 'SELECT * FROM get_client_bookings($1)';
            const { rows } = await pool.query(queryText, [clientPhone]);

            res.json(rows);
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Error, ${error.message}`);
        }
    }

    async getAllAppointments (req, res) {
        try {
            const queryText = 'SELECT * FROM get_all_bookings()';
            const { rows } = await pool.query(queryText);

            res.json(rows);
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Error, ${error.message}`);
        }
    }

    async getBookedSlotsByDate(req, res) {
        try {
            const { date } = req.query;
    
            if (!date) {
                return res.status(400).json({ message: "Missing date parameter" });
            }
    
            const result = await pool.query(
                `SELECT booking_date, booking_time FROM bookings WHERE booking_date = $1`,
                [date]
            );
    
            res.status(200).json(result.rows);
        } catch (err) {
            console.error("Error when receiving employed slots:", err);
            res.status(500).json({ message: "Something went wrong", error: err.toString() });
        }
    }

    async getAllServices(req, res) {
        try {
            const services = await pool.query('SELECT * FROM services');
            res.json(services.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    };
    async addBooking(req, res) {
        try {
            const { phone, model_id, car_year, engine_capacity, fuel_id, comment, booking_date, booking_time, services } = req.body;
    
            const status_id = 1;  
    
            const client = await pool.connect();
    
            try {
                await client.query("BEGIN");
    
                const result = await client.query(
                    `INSERT INTO bookings 
                    (phone, model_id, car_year, engine_capacity, fuel_id, comment, booking_date, booking_time, status_id, status_changed_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
                    RETURNING id`,
                    [phone.replace(/\s+/g, ''), model_id, car_year, engine_capacity, fuel_id, comment || null, booking_date, booking_time, status_id]
                );
    
                const bookingId = result.rows[0].id;
    
                if (services && services.length > 0) {
                    const values = services.map((_, i) => `($1, $${i + 2})`).join(", ");
                    await client.query(
                        `INSERT INTO booking_services (booking_id, service_id) VALUES ${values}`,
                        [bookingId, ...services]
                    );
                }
    
                await client.query("COMMIT");
    
                res.status(201).json({ message: "Appointment created successfully" });
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
    
        } catch (error) {
            console.error("Ошибка при создании записи:", error);
            res.status(500).json({ message: "Something went wrong. Try again later...", error: error.toString() });
        }
    }    

    async updateBookingDateTime(req, res) {
        try {
            const bookingId = req.params.id;
            const { booking_date, booking_time } = req.body;
    
            if (!booking_date || !booking_time) {
                return res.status(400).json({ message: "Missing date or time" });
            }
    
            const result = await pool.query(
                `UPDATE bookings 
                 SET booking_date = $1, booking_time = $2
                 WHERE id = $3
                 RETURNING *`,
                [booking_date, booking_time, bookingId]
            );
    
            if (result.rowCount === 0) {
                return res.status(404).json({ message: "Booking not found" });
            }
    
            res.status(200).json({ message: "Booking date/time updated", booking: result.rows[0] });
        } catch (err) {
            console.error("Error updating booking date/time:", err);
            res.status(500).json({ message: "Internal server error", error: err.toString() });
        }
    }    

    async cancelBooking(req, res) {
        try {
            const bookingId = req.params.id;
            const { comment } = req.body;

            if (!comment || comment.trim().length === 0) {
                return res.status(400).json({ message: "Comment is required" });
            }

            const updateBookingResult = await pool.query(
                `UPDATE bookings 
                 SET status_id = $1, status_changed_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [CANCELLED_BY_CLIENT_STATUS_ID, bookingId]
            );

            if (updateBookingResult.rowCount === 0) {
                return res.status(404).json({ message: "Booking not found" });
            }

            const booking = updateBookingResult.rows[0];

            await pool.query(
                `INSERT INTO booking_comments (booking_id, comment, comment_type)
                 VALUES ($1, $2, 'client')`,
                [bookingId, comment]
            );

            res.status(200).json({
                message: "Booking cancelled successfully",
                booking,
            });
        } catch (err) {
            console.error("Error cancelling booking:", err);
            res.status(500).json({ message: "Internal server error", error: err.toString() });
        }
    }
}

module.exports = new BookingController()