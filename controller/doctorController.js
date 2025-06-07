const Clinic = require("../model/clinic");
const Expense = require("../model/expense");
const Payment = require("../model/payment");
const { Op } = require("sequelize");

const offlineExpenseIdMap = {};

var doctorController = {
  addClinic: async function (req, res) {
    try {
      const doctor = req.user;
      const { name, address, admin_name, additional_info, contact_no } =
        req.body;

      const clinic = await Clinic.create({
        name,
        address,
        admin_name,
        additional_info,
        contact_no,
        doctor_id: doctor.id,
      });
      res.status(201).json({ message: "Clinic added successfully.", clinic });
    } catch (error) {
      console.error("Error adding clinic:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getClinicList: async function (req, res) {
    try {
      const doctor = req.user;
      const clinicId = req.query.id; // support ?id=CLINIC_ID

      if (clinicId) {
        // Fetch single clinic by id for the logged-in doctor
        const clinic = await Clinic.findOne({
          where: { id: clinicId, doctor_id: doctor.id },
          attributes: [
            "id",
            "name",
            "address",
            "admin_name",
            "additional_info",
            "contact_no",
            "createdAt",
            "updatedAt",
          ],
        });
        if (!clinic) {
          return res.status(404).json({ message: "Clinic not found." });
        }
        return res.status(200).json({ clinic });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      // Fetch clinics for the logged-in doctor with pagination
      const { count, rows } = await Clinic.findAndCountAll({
        where: { doctor_id: doctor.id },
        attributes: [
          "id",
          "name",
          "address",
          "admin_name",
          "additional_info",
          "contact_no",
          "createdAt",
          "updatedAt",
        ],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);
      const clinics = {
        total: count,
        page,
        pageSize: limit,
        totalPages,
        clinics: rows,
      };

      res.status(200).json({ clinics });
    } catch (error) {
      console.error("Error fetching clinic list:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  updateClinic: async function (req, res) {
    try {
      const doctor = req.user;
      const clinicId = req.params.id;

      // Only allow update of fields except 'name'
      const { address, admin_name, additional_info, contact_no } = req.body;

      const clinic = await Clinic.findOne({
        where: { id: clinicId, doctor_id: doctor.id },
      });

      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found." });
      }

      // Update allowed fields
      clinic.address = address !== undefined ? address : clinic.address;
      clinic.admin_name =
        admin_name !== undefined ? admin_name : clinic.admin_name;
      clinic.additional_info =
        additional_info !== undefined
          ? additional_info
          : clinic.additional_info;
      clinic.contact_no =
        contact_no !== undefined ? contact_no : clinic.contact_no;

      await clinic.save();

      res.status(200).json({ message: "Clinic updated successfully.", clinic });
    } catch (error) {
      console.error("Error updating clinic:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  deleteClinic: async function (req, res) {
    try {
      const doctor = req.user;
      const clinicId = req.params.id;

      // Find the clinic belonging to the logged-in doctor
      const clinic = await Clinic.findOne({
        where: { id: clinicId, doctor_id: doctor.id },
      });

      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found." });
      }

      await clinic.destroy();

      res.status(200).json({ message: "Clinic deleted successfully." });
    } catch (error) {
      console.error("Error deleting clinic:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  addExpense: async function (req, res) {
    try {
      const doctor = req.user;
      const {
        notes,
        expense_date,
        category,
        billed_amount,
        tds_deducted,
        tds_amount,
        amount_received,
        payment_mode,
        payment_status,
        clinic_id,
        payment_local_id,
      } = req.body;
      const offline_id = req.body.payment_local_id || null;
      const clinic = await Clinic.findOne({
        where: { id: clinic_id, doctor_id: doctor.id },
      });
      if (!clinic) {
        return res.status(404).json({
          message: "Clinic not found or does not belong to the doctor.",
        });
      }

      // Create expense entry
      const expense = await Expense.create({
        notes,
        expense_date,
        category,
        billed_amount,
        tds_deducted,
        tds_amount,
        payment_mode,
        payment_status,
        clinic_id,
      });

      // Store offline_id mapping if present
      if (offline_id) {
        offlineExpenseIdMap[offline_id] = expense.id;
      }

      // Create payment entry
      if (amount_received > 0) {
        await Payment.create({
          payment_date: expense_date,
          amount: amount_received,
          expense_id: expense.id,
        });
      }

      res.status(201).json({
        message: "Expense and payment added successfully.",
        id: expense.id,
        payment_local_id
      });
    } catch (error) {
      console.error("Error adding expense and payment:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getAllExpenses: async function (req, res) {
    try {
      const doctor = req.user;
      const { clinic_id, expense_id } = req.query;

      // Pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Filter clinics by doctor (and optionally by clinic_id)
      const clinicWhere = clinic_id
        ? { id: clinic_id, doctor_id: doctor.id }
        : { doctor_id: doctor.id };
      const clinics = await Clinic.findAll({
        where: clinicWhere,
        attributes: ["id"],
      });
      const clinicIds = clinics.map((c) => c.id);

      if (clinicIds.length === 0) {
        return res.status(200).json({
          total: 0,
          page,
          pageSize: limit,
          totalPages: 0,
          expenses: [],
        });
      }

      // If both clinic_id and expense_id are provided, return single expense
      if (clinic_id && expense_id) {
        const expense = await Expense.findOne({
          where: { id: expense_id, clinic_id: clinic_id },
          include: [{ model: Clinic, as: "clinic", attributes: ["name"] }],
        });
        if (!expense) {
          return res.status(404).json({ message: "Expense not found." });
        }
        const payments = await Payment.findAll({
          where: { expense_id: expense.id },
          attributes: ["id", "payment_date", "amount"],
          order: [["payment_date", "ASC"]],
        });
        const received_amount = payments.reduce(
          (sum, p) => sum + parseFloat(p.amount),
          0
        );
        const pending_amount =
          parseFloat(expense.billed_amount) - received_amount;

        // Remove the 'clinic' object, only keep clinic_name
        const expenseObj = expense.toJSON();
        delete expenseObj.clinic;

        return res.status(200).json({
          expense: {
            ...expenseObj,
            clinic_name: expense.clinic ? expense.clinic.name : null,
            received_amount,
            pending_amount,
            payments,
          },
        });
      }

      // Always use pagination, even if clinic_id is provided
      const { count, rows } = await Expense.findAndCountAll({
        where: { clinic_id: clinicIds },
        order: [["expense_date", "DESC"]],
        limit,
        offset,
        include: [{ model: Clinic, as: "clinic", attributes: ["name"] }],
      });

      // For each expense, calculate received_amount, pending_amount, add clinic_name, and payments
      const expensesWithAmounts = await Promise.all(
        rows.map(async (expense) => {
          const payments = await Payment.findAll({
            where: { expense_id: expense.id },
            attributes: ["id", "payment_date", "amount"],
            order: [["payment_date", "ASC"]],
          });
          const received_amount = payments.reduce(
            (sum, p) => sum + parseFloat(p.amount),
            0
          );
          const pending_amount =
            parseFloat(expense.billed_amount) - received_amount;
          const expenseObj = expense.toJSON();
          delete expenseObj.clinic;
          return {
            ...expenseObj,
            clinic_name: expense.clinic ? expense.clinic.name : null,
            received_amount,
            pending_amount,
            payments,
          };
        })
      );

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        total: count,
        page,
        pageSize: limit,
        totalPages,
        expenses: expensesWithAmounts,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  deleteExpense: async function (req, res) {
    try {
      const doctor = req.user;
      const expenseId = req.params.id;

      // Find the expense and ensure it belongs to one of the doctor's clinics
      const clinics = await Clinic.findAll({
        where: { doctor_id: doctor.id },
        attributes: ["id"],
      });
      const clinicIds = clinics.map((c) => c.id);

      const expense = await Expense.findOne({
        where: { id: expenseId, clinic_id: clinicIds },
      });

      if (!expense) {
        return res.status(404).json({
          message: "Expense not found or does not belong to your clinics.",
        });
      }

      await expense.destroy();

      res.status(200).json({ message: "Expense deleted successfully." });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  addPayment: async function (req, res) {
    try {
      const doctor = req.user;
      const { date, amount, offlineExpenseId } = req.body;
      var expenseId = req.body.expenseId;
      console.log(offlineExpenseIdMap)
      // If offlineExpenseId is present, get the mapped expenseId from the global map
      if (offlineExpenseId && offlineExpenseIdMap[offlineExpenseId]) {
        expenseId = offlineExpenseIdMap[offlineExpenseId];
        // Remove the key after using it
        delete offlineExpenseIdMap[offlineExpenseId];
      } else if (offlineExpenseId) {
        expenseId = offlineExpenseId;
      }

      // Check if the expense belongs to one of the doctor's clinics
      const expense = await Expense.findOne({
        where: { id: expenseId },
        include: [
          {
            model: Clinic,
            as: "clinic",
            where: { doctor_id: doctor.id },
          },
        ],
      });

      if (!expense) {
        return res.status(404).json({
          message: "Expense not found or does not belong to your clinics.",
        });
      }

      // Create the payment
      const payment = await Payment.create({
        payment_date: date || new Date(),
        amount,
        expense_id: expenseId,
      });

      res.status(201).json({ message: "Payment added successfully.", payment });
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getAllClinicNames: async function (req, res) {
    try {
      const doctor = req.user;
      const clinics = await require("../model/clinic").findAll({
        where: { doctor_id: doctor.id },
        attributes: ["id", "name"],
      });
      res.status(200).json({ clinics });
    } catch (error) {
      console.error("Error fetching clinic names:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
  getReport: async function (req, res) {
    try {
      const doctor = req.user;
      const {
        clinic_id,
        expense_id,
        startDate,
        endDate,
        tdsDeducted,
        expenseCategory,
      } = req.query;

      // Pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Filter clinics by doctor (and optionally by clinic_id)
      const clinicWhere = clinic_id
        ? { id: clinic_id, doctor_id: doctor.id }
        : { doctor_id: doctor.id };
      const clinics = await Clinic.findAll({
        where: clinicWhere,
        attributes: ["id"],
      });
      const clinicIds = clinics.map((c) => c.id);

      if (clinicIds.length === 0) {
        return res.status(200).json({
          total: 0,
          page,
          pageSize: limit,
          totalPages: 0,
          expenses: [],
        });
      }

      // Build expense filter
      let expenseWhere = { clinic_id: clinicIds };
      if (startDate && endDate) {
        expenseWhere.expense_date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        expenseWhere.expense_date = { [Op.gte]: startDate };
      } else if (endDate) {
        expenseWhere.expense_date = { [Op.lte]: endDate };
      }
      if (typeof tdsDeducted !== "undefined") {
        expenseWhere.tds_deducted =
          tdsDeducted === "true" || tdsDeducted === true;
      }
      if (expenseCategory) {
        expenseWhere.category = expenseCategory;
      }

      // If both clinic_id and expense_id are provided, return single expense
      if (clinic_id && expense_id) {
        const expense = await Expense.findOne({
          where: { id: expense_id, clinic_id: clinic_id, ...expenseWhere },
          include: [{ model: Clinic, as: "clinic", attributes: ["name"] }],
        });
        if (!expense) {
          return res.status(404).json({ message: "Expense not found." });
        }
        const payments = await Payment.findAll({
          where: { expense_id: expense.id },
        });
        const received_amount = payments.reduce(
          (sum, p) => sum + parseFloat(p.amount),
          0
        );
        const pending_amount =
          parseFloat(expense.billed_amount) - received_amount;

        // Remove the 'clinic' object, only keep clinic_name
        const expenseObj = expense.toJSON();
        delete expenseObj.clinic;

        return res.status(200).json({
          expense: {
            ...expenseObj,
            clinic_name: expense.clinic ? expense.clinic.name : null,
            received_amount,
            pending_amount,
          },
        });
      }

      // Always use pagination, even if clinic_id is provided
      const { count, rows } = await Expense.findAndCountAll({
        where: expenseWhere,
        order: [["expense_date", "DESC"]],
        limit,
        offset,
        include: [{ model: Clinic, as: "clinic", attributes: ["name"] }],
      });

      // For each expense, calculate received_amount, pending_amount, and add clinic_name
      let total_billed = 0;
      let total_received = 0;
      let total_pending = 0;
      let total_tds = 0;

      const expensesWithAmounts = await Promise.all(
        rows.map(async (expense) => {
          const payments = await Payment.findAll({
            where: { expense_id: expense.id },
          });
          const received_amount = payments.reduce(
            (sum, p) => sum + parseFloat(p.amount),
            0
          );
          const pending_amount =
            parseFloat(expense.billed_amount) - received_amount;
          const tds_amount = parseFloat(expense.tds_amount) || 0;

          total_billed += parseFloat(expense.billed_amount) || 0;
          total_received += received_amount;
          total_pending += pending_amount;
          total_tds += tds_amount;

          const expenseObj = expense.toJSON();
          delete expenseObj.clinic;
          return {
            ...expenseObj,
            clinic_name: expense.clinic ? expense.clinic.name : null,
            received_amount,
            pending_amount,
            tds_amount,
          };
        })
      );

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        total: count,
        page,
        pageSize: limit,
        totalPages,
        total_billed,
        total_received,
        total_pending,
        total_tds,
        expenses: expensesWithAmounts,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
  fullDataLoad: async function (req, res) {
    try {
      const doctor = req.user;
      const clinics = await Clinic.findAll({
        where: { doctor_id: doctor.id },
        attributes: [
          "id",
          "name",
          "address",
          "admin_name",
          "contact_no",
          "additional_info",
          "createdAt",
          "updatedAt"
        ],
      });
      // Prepare clinicIdNameList: [{ id, name }]
      const clinicIdNameList = clinics.map(clinic => ({
        id: clinic.id,
        name: clinic.name
      }));
      const clinicIds = clinics.map((c) => c.id);

      const expenses = await Expense.findAll({
        where: { clinic_id: clinicIds },
        include: [{ model: Clinic, as: "clinic", attributes: ["name"] }],
        order: [["expense_date", "DESC"]],
      });

      const expenseIds = expenses.map((e) => e.id);

      const payments = await Payment.findAll({
        where: { expense_id: expenseIds },
        order: [["payment_date", "ASC"]],
      });

      // Group payments by expense_id for quick lookup
      const paymentsByExpense = payments.reduce((acc, payment) => {
        if (!acc[payment.expense_id]) acc[payment.expense_id] = [];
        acc[payment.expense_id].push(payment);
        return acc;
      }, {});

      // Add received_amount and pending_amount to each expense
      const expensesWithAmounts = expenses.map((expense) => {
        const expensePayments = paymentsByExpense[expense.id] || [];
        const received_amount = expensePayments.reduce(
          (sum, p) => sum + parseFloat(p.amount),
          0
        );
        const pending_amount =
          parseFloat(expense.billed_amount) - received_amount;
        const expenseObj = expense.toJSON();
        return {
          ...expenseObj,
          received_amount,
          pending_amount,
        };
      });

  
      res.status(200).json({ clinics, expenses: expensesWithAmounts, payments, clinicIdNameList });
    } catch (error) {
      console.error("Error loading full data:", error);
      res.status(500).json({ message: "Internal server error." });
    }   
  }
};

module.exports = doctorController;
