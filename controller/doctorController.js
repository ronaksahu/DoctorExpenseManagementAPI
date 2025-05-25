const Clinic = require('../model/clinic');
const Expense = require('../model/expense');
const Payment = require('../model/payment');   

var doctorController = {
    addClinic: async function(req, res) {
        try {
            const doctor = req.user; 

            const { name, address, admin_name, additional_info, contact_no } = req.body;

            const clinic = await Clinic.create({
                    name,
                    address,
                    admin_name,
                    additional_info,
                    contact_no,
                    "doctor_id": doctor.id
            });
            res.status(201).json({ message: 'Clinic added successfully.', clinic });
        } catch (error) {
            console.error('Error adding clinic:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
        
    },
    getClinicList: async function(req, res) {
        try {
            const doctor = req.user; 
            const clinicId = req.query.id; // support ?id=CLINIC_ID

            if (clinicId) {
                // Fetch single clinic by id for the logged-in doctor
                const clinic = await Clinic.findOne({
                    where: { id: clinicId, doctor_id: doctor.id },
                    attributes: ['id', 'name', 'address', 'admin_name', 'additional_info', 'contact_no', 'createdAt', 'updatedAt']
                });
                if (!clinic) {
                    return res.status(404).json({ message: 'Clinic not found.' });
                }
                return res.status(200).json({ clinic });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            // Fetch clinics for the logged-in doctor with pagination
            const { count, rows } = await Clinic.findAndCountAll({
                where: { doctor_id: doctor.id },
                attributes: ['id', 'name', 'address', 'admin_name', 'additional_info', 'contact_no', 'createdAt', 'updatedAt'],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const clinics = {
                total: count,
                page,
                pageSize: limit,
                totalPages,
                clinics: rows
            };

            res.status(200).json({ clinics });
        } catch (error) {
            console.error('Error fetching clinic list:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    },
    updateClinic: async function(req, res) {
        try {
            const doctor = req.user;
            const clinicId = req.params.id;

            // Only allow update of fields except 'name'
            const { address, admin_name, additional_info, contact_no } = req.body;

            const clinic = await Clinic.findOne({
                where: { id: clinicId, doctor_id: doctor.id }
            });

            if (!clinic) {
                return res.status(404).json({ message: 'Clinic not found.' });
            }

            // Update allowed fields
            clinic.address = address !== undefined ? address : clinic.address;
            clinic.admin_name = admin_name !== undefined ? admin_name : clinic.admin_name;
            clinic.additional_info = additional_info !== undefined ? additional_info : clinic.additional_info;
            clinic.contact_no = contact_no !== undefined ? contact_no : clinic.contact_no;

            await clinic.save();

            res.status(200).json({ message: 'Clinic updated successfully.', clinic });
        } catch (error) {
            console.error('Error updating clinic:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    },
    deleteClinic: async function(req, res) {
        try {
            const doctor = req.user;
            const clinicId = req.params.id;

            // Find the clinic belonging to the logged-in doctor
            const clinic = await Clinic.findOne({
                where: { id: clinicId, doctor_id: doctor.id }
            });

            if (!clinic) {
                return res.status(404).json({ message: 'Clinic not found.' });
            }

            await clinic.destroy();

            res.status(200).json({ message: 'Clinic deleted successfully.' });
        } catch (error) {
            console.error('Error deleting clinic:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    },
    addExpense: async function(req, res) {
        try {
            const doctor = req.user;
            const {
                notes, expense_date, category, billed_amount, tds_deducted, tds_amount,
                total_amount, amount_received, payment_mode, payment_status, clinic_id
            } = req.body;

            const clinic = await Clinic.findOne({
                where: { id: clinic_id, doctor_id: doctor.id }
            });
            if (!clinic) {
                return res.status(404).json({ message: 'Clinic not found or does not belong to the doctor.' });
            }

            // Create expense entry
            const expense = await Expense.create({
                notes,
                expense_date,
                category,
                billed_amount,
                tds_deducted,
                tds_amount,
                total_amount,
                payment_mode,
                payment_status,
                clinic_id
            });

            // Create payment entry
            if (amount_received > 0 ){
                await Payment.create({
                    payment_date: expense_date,
                    amount: amount_received,
                    expense_id: expense.id
                });
            }
            

            res.status(201).json({
                message: 'Expense and payment added successfully.'
            });
        } catch (error) {
            console.error('Error adding expense and payment:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
}

module.exports = doctorController;