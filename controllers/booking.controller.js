const { CANCELLED_BY_CLIENT_STATUS_ID, CANCELLED_BY_MANAGER_STATUS_ID, CLIENT_DO_NOT_COME_STATUS_ID, DONE_STATUS_ID } = require('../config/booking-statuses');
const pool = require('../db');
const { calculateYearModifier } = require('../helpers/helpers');

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
            const {
                phone,
                model_id,
                car_year,
                engine_capacity,
                fuel_id,
                comment,
                booking_date,
                booking_time,
                services
            } = req.body;
    
            const status_id = 1;
    
            const client = await pool.connect();
    
            try {
                await client.query("BEGIN");
    
                const result = await client.query(
                    `INSERT INTO bookings 
                    (phone, model_id, car_year, engine_capacity, fuel_id, comment, booking_date, booking_time, status_id, status_changed_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
                    RETURNING id`,
                    [
                        phone.replace(/\s+/g, ''),
                        model_id,
                        car_year,
                        engine_capacity,
                        fuel_id,
                        comment || null,
                        booking_date,
                        booking_time,
                        status_id
                    ]
                );
    
                const bookingId = result.rows[0].id;
    
                const yearModifier = calculateYearModifier(car_year);
    
                if (services && services.length > 0) {
                    const serviceInsertValues = services.map((_, i) => `($1, $${i + 2})`).join(', ');
                    await client.query(
                        `INSERT INTO booking_services (booking_id, service_id) VALUES ${serviceInsertValues}`,
                        [bookingId, ...services]
                    );
    
                    const serviceData = await client.query(
                        `SELECT id, base_price FROM services WHERE id = ANY($1::int[])`,
                        [services]
                    );
                    const serviceMap = new Map(serviceData.rows.map(s => [s.id, parseFloat(s.base_price)]));
    
                    const detailValues = [];
                    const detailParams = [];
    
                    services.forEach((serviceId, i) => {
                        const basePrice = serviceMap.get(serviceId);
                        const finalPrice = basePrice + yearModifier;
    
                        detailValues.push(
                            `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
                        );
                        detailParams.push(bookingId, serviceId, basePrice, yearModifier, finalPrice);
                    });
    
                    await client.query(
                        `INSERT INTO booking_service_details (booking_id, service_id, base_price, year_modifier, final_price)
                         VALUES ${detailValues.join(', ')}`,
                        detailParams
                    );
                }
    
                await client.query("COMMIT");
    
                res.status(201).json({ message: "Appointment created successfully" });
    
            } catch (err) {
                await client.query("ROLLBACK");
                console.error("Ошибка в транзакции:", err);
                res.status(500).json({ message: "Transaction failed", error: err.toString() });
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
            const { booking_date, booking_time, managerComment } = req.body;
    
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

            if (managerComment && managerComment.trim().length > 0) {
                await pool.query(
                    `INSERT INTO booking_comments (booking_id, comment, comment_type)
                     VALUES ($1, $2, $3)`,
                    [bookingId, managerComment.trim(), 'manager']
                );
            }
    
            res.status(200).json({ message: "Booking date/time updated", booking: result.rows[0] });
        } catch (err) {
            console.error("Error updating booking date/time:", err);
            res.status(500).json({ message: "Internal server error", error: err.toString() });
        }
    }    

    async updateBookingStatus(req, res) {
        try {
            const bookingId = req.params.id;
            const { status_id, comment } = req.body;
    
            const allowedStatuses = [
                DONE_STATUS_ID,
                CLIENT_DO_NOT_COME_STATUS_ID,
                CANCELLED_BY_MANAGER_STATUS_ID,
                CANCELLED_BY_CLIENT_STATUS_ID,
            ];
    
            if (!allowedStatuses.includes(status_id)) {
                return res.status(400).json({ message: "Invalid status_id" });
            }
    
            const commentTypesByStatus = {
                [CANCELLED_BY_CLIENT_STATUS_ID]: 'client',
                [CANCELLED_BY_MANAGER_STATUS_ID]: 'manager',
                [DONE_STATUS_ID]: 'manager',
                [CLIENT_DO_NOT_COME_STATUS_ID]: 'manager',
            };
    
            const commentType = commentTypesByStatus[status_id];
    
            const commentRequired = [
                CANCELLED_BY_CLIENT_STATUS_ID,
                CANCELLED_BY_MANAGER_STATUS_ID,
            ];
    
            if (commentRequired.includes(status_id)) {
                if (!comment || comment.trim().length === 0) {
                    return res.status(400).json({ message: "Comment is required for this status" });
                }
            }
    
            const updateBookingResult = await pool.query(
                `UPDATE bookings 
                 SET status_id = $1, status_changed_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [status_id, bookingId]
            );
    
            if (updateBookingResult.rowCount === 0) {
                return res.status(404).json({ message: "Booking not found" });
            }
    
            const booking = updateBookingResult.rows[0];
    
            if (comment && comment.trim().length > 0) {
                await pool.query(
                    `INSERT INTO booking_comments (booking_id, comment, comment_type)
                     VALUES ($1, $2, $3)`,
                    [bookingId, comment.trim(), commentType]
                );
            }
    
            res.status(200).json({
                message: "Booking status updated successfully",
                booking,
            });
        } catch (err) {
            console.error("Error updating booking status:", err);
            res.status(500).json({ message: "Internal server error", error: err.toString() });
        }
    }    

    async updateBookingDetails(req, res) {
        const client = await pool.connect();
        try {
            const bookingId = req.params.id;
            const {
                model_id,
                car_year,
                engine_capacity,
                fuel_id,
                services = [],
                comment
            } = req.body;
    
            await client.query("BEGIN");
    
            await client.query(`
                UPDATE bookings
                SET model_id = $1,
                    car_year = $2,
                    engine_capacity = $3,
                    fuel_id = $4
                WHERE id = $5
            `, [
                model_id,
                car_year,
                engine_capacity,
                fuel_id,
                bookingId
            ]);
    
            await client.query(
                `DELETE FROM booking_services WHERE booking_id = $1`,
                [bookingId]
            );
            await client.query(
                `DELETE FROM booking_service_details WHERE booking_id = $1`,
                [bookingId]
            );
    
            if (services.length > 0) {
                const insertServiceValues = services.map((_, i) => `($1, $${i + 2})`).join(', ');
                await client.query(
                    `INSERT INTO booking_services (booking_id, service_id) VALUES ${insertServiceValues}`,
                    [bookingId, ...services]
                );
    
                const serviceData = await client.query(
                    `SELECT id, base_price FROM services WHERE id = ANY($1::int[])`,
                    [services]
                );
                const serviceMap = new Map(serviceData.rows.map(s => [s.id, parseFloat(s.base_price)]));
                const yearModifier = calculateYearModifier(car_year);
    
                const detailValues = [];
                const detailParams = [];
    
                services.forEach((serviceId, i) => {
                    const basePrice = serviceMap.get(serviceId);
                    const finalPrice = basePrice + yearModifier;
    
                    detailValues.push(
                        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
                    );
                    detailParams.push(bookingId, serviceId, basePrice, yearModifier, finalPrice);
                });
    
                await client.query(
                    `INSERT INTO booking_service_details (booking_id, service_id, base_price, year_modifier, final_price)
                     VALUES ${detailValues.join(', ')}`,
                    detailParams
                );
            }

            if (comment && comment.trim().length > 0) {
                await pool.query(
                    `INSERT INTO booking_comments (booking_id, comment, comment_type)
                     VALUES ($1, $2, $3)`,
                    [bookingId, comment.trim(), 'manager']
                );
            }
    
            await client.query("COMMIT");
    
            res.status(200).json({ message: "Booking updated successfully" });
    
        } catch (err) {
            await client.query("ROLLBACK");
            console.error("Error updating booking:", err);
            res.status(500).json({ message: "Failed to update booking", error: err.toString() });
        } finally {
            client.release();
        }
    }    
}

module.exports = new BookingController()