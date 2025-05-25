const Doctor = require('../model/doctor'); 

var adminController = {
    getAllDoctors: async function(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const { access_status } = req.query;

            const where = {};
            if (access_status) {
                where.access_status = access_status;
            }
            // Fetch doctors with pagination
            const { count, rows } = await Doctor.findAndCountAll({
                where,
                attributes: ['id', 'name', 'specialty', 'email', 'degree', 'contact_no', 'access_status', 'createdAt', 'updatedAt'],
                limit,
                offset
            });
            const totalPages = Math.ceil(count / limit);

            res.status(200).json({
                total: count,
                totalPages,
                page,
                pageSize: limit,
                doctors: rows
            });
        } catch (error) {
            console.error('Error fetching doctor list:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    },
    updateDoctorAccessStatus: async function(req, res) {
        try {
            const doctorId = req.params.id;
            const { access_status } = req.body;

            const doctor = await Doctor.findByPk(doctorId);
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found.' });
            }

            doctor.access_status = access_status;
            await doctor.save();

            res.status(200).json({ message: 'Access status updated successfully.' });
        } catch (error) {
            console.error('Error updating access status:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    }

}

module.exports = adminController;