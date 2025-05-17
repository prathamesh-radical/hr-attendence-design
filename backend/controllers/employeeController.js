import db from "../db/db.js";

// Register Employee (by Admin)


// Register Employee (by Admin)
export const registerEmployee = (req, res) => {

    const { name, last_name, email, phone, designation, join_date, admin_id, company_name, gender } = req.body;

    // Validate required fields
    if (!admin_id || isNaN(admin_id) || !company_name || !name || !email || !phone || !designation || !join_date || !gender) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Validate gender
    const validGenders = ["Male", "Female", "Other"];
    if (!validGenders.includes(gender)) {
        return res.status(400).json({ message: "Invalid gender value. Must be 'Male', 'Female', or 'Other'." });

    }

    // Generate company prefix based on company name
    const words = company_name.trim().split(" ");
    const companyPrefix = words.map(word => word[0].toUpperCase()).join(""); // e.g., "Radical Global" → "RG"

    // Query to get the last office_id for this admin
    const officeIdQuery = `SELECT MAX(CAST(SUBSTRING_INDEX(office_id, '-', -1) AS UNSIGNED)) AS last_office_id 
                           FROM employees WHERE admin_id = ?`;

    db.query(officeIdQuery, [admin_id], (err, officeResult) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching last office ID", error: err });
        }

        const lastOfficeId = officeResult[0].last_office_id || 0; // Default to 0 if no employees exist
        const newOfficeId = `${companyPrefix}-${lastOfficeId + 1}`;

        // Query to get the last emp_id globally
        const empIdQuery = `SELECT MAX(CAST(SUBSTRING_INDEX(emp_id, '-', -1) AS UNSIGNED)) AS last_emp_id FROM employees`;

        db.query(empIdQuery, [], (err, empResult) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching last emp ID", error: err });
            }

            const lastEmpId = empResult[0].last_emp_id || 0; // Default to 0 if no employees exist
            const newEmpId = `EMP-${lastEmpId + 1}`; // Increment globally


            // Insert new employee with emp_id, office_id, and gender
            const insertQuery = `INSERT INTO employees (emp_id, office_id, name, last_name, email, admin_id, phone, designation, join_date, gender, status) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`;

            db.query(insertQuery, [newEmpId, newOfficeId, name, last_name, email, admin_id, phone, designation, join_date, gender], (err, result) => {

                if (err) {
                    return res.status(500).json({ message: "Error registering employee", error: err });
                }
                res.status(201).json({ message: "Employee registered successfully!", emp_id: newEmpId, office_id: newOfficeId });
            });
        });
    });
};


export const employeeCount = (req, res) => {
    try {
        const adminId = req.user.adminId; // Ensure adminId is correctly set from authMiddleware

        db.query(
            `
            SELECT 
                COUNT(*) AS total_count,
                SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS male_count,
                SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS female_count
            FROM employees 
            WHERE admin_id = ? AND status = 'active'
            `,
            [adminId],
            (error, results) => {
                if (error) {
                    console.error("Error fetching employee counts:", error);
                    return res.status(500).json({ message: "Internal server error" });
                }
                res.json({
                    total_count: results[0].total_count,
                    male_count: results[0].male_count,
                    female_count: results[0].female_count
                });
            }
        );
    } catch (error) {
        console.error("Error fetching employee counts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

  export const getEmployeesByAdmin = (req, res) => {
    try {
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        db.query(
            "SELECT * FROM employees WHERE admin_id = ? AND status = 'active'", 
            [admin_id], 
            (err, results) => {
                if (err) {
                    console.error("Database Query Error:", err);
                    return res.status(500).json({ error: "Failed to fetch employees" });
                }

                res.json(results);
            }
        );
    } catch (error) {
        console.error("Error in getEmployeesByAdmin:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Get Deactivated Employees by Admin ID
// Get Deactivated Employees
export const getDeactivatedEmployees = (req, res) => {
    try {
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        const sql = "SELECT * FROM employees WHERE admin_id = ? AND status = 'deactivated'";

        db.query(sql, [admin_id], (err, results) => {
            if (err) {
                console.error("Database Query Error:", err);
                return res.status(500).json({ error: "Failed to fetch deactivated employees" });
            }

           
            res.json(results);
        });
    } catch (error) {
        console.error("Error in getDeactivatedEmployees:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Soft Delete (Deactivate Employee)
export const deactivateEmployee = (req, res) => {
    try {
        const { emp_id } = req.params;
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        const sql = "UPDATE employees SET status = 'deactivated' WHERE emp_id = ? AND admin_id = ?";

        db.query(sql, [emp_id, admin_id], (err, result) => {
            if (err) {
                console.error("Database Update Error:", err);
                return res.status(500).json({ error: "Failed to deactivate employee" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Employee not found or already deactivated" });
            }

            res.json({ message: "Employee deactivated successfully" });
        });
    } catch (error) {
        console.error("Error in deactivateEmployee:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const activateEmployee = (req, res) => {
    const { emp_id } = req.params;
    const admin_id = req.user.admin_id || req.user.adminId; 

    if (!admin_id) {
        return res.status(400).json({ error: "Admin ID is missing" });
    }

    const sql = "UPDATE employees SET status = 'active' WHERE emp_id = ? AND admin_id = ?";
    
    db.query(sql, [emp_id, admin_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Failed to activate employee" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Employee not found or already active" });
        }

        res.json({ message: "Employee activated successfully" });
    });
};

export const getEmployeeDetails =  async (req, res) => {
    try {
        const { emp_id } = req.params;
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure the admin can only see their employees

        if (!emp_id) {
            return res.status(400).json({ error: "Employee ID is required" });
        }

        const sql = "SELECT * FROM employees WHERE emp_id = ? AND admin_id = ?";
        
        db.query(sql, [emp_id, admin_id], (err, result) => {
            if (err) {
                console.error("Database Query Error:", err);
                return res.status(500).json({ error: "Failed to fetch employee details" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "Employee not found" });
            }

            res.json(result[0]); // Send employee data as a response
        });
    } catch (error) {
        console.error("Error in getEmployeeById:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



export const updateEmployeeDetails = (req, res) => {
    const { emp_id } = req.params;
    const admin_id = req.user.admin_id || req.user.adminId;
    const updatedData = req.body;

    if (!admin_id) {
        return res.status(400).json({ error: "Admin ID is missing" });
    }

    // First, fetch the existing employee details
    const selectSql = "SELECT * FROM employees WHERE emp_id = ? AND admin_id = ?";
    db.query(selectSql, [emp_id, admin_id], (err, results) => {
        if (err) {
            console.error("Fetch Employee Error:", err);
            return res.status(500).json({ error: "Failed to fetch employee details" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Employee not found or unauthorized update" });
        }

        // Merge existing data with updated fields
        const existingEmployee = results[0];
        const mergedData = {
            name: updatedData.name || existingEmployee.name,
            last_name: updatedData.last_name || existingEmployee.last_name,
            email: updatedData.email || existingEmployee.email,
            phone: updatedData.phone || existingEmployee.phone,
            designation: updatedData.designation || existingEmployee.designation,
            join_date: updatedData.join_date || existingEmployee.join_date,
            office_id: updatedData.office_id || existingEmployee.office_id,
            status: updatedData.status || existingEmployee.status,
            father_name: updatedData.father_name || existingEmployee.father_name,
            address: updatedData.address || existingEmployee.address,
            city: updatedData.city || existingEmployee.city,
            state: updatedData.state || existingEmployee.state,
            postal_code: updatedData.postal_code || existingEmployee.postal_code,
            country: updatedData.country || existingEmployee.country,
            gender: updatedData.gender || existingEmployee.gender,
            dob: updatedData.dob || existingEmployee.dob,
            marital_status: updatedData.marital_status || existingEmployee.marital_status,
            blood_group: updatedData.blood_group || existingEmployee.blood_group,
            pan_number: updatedData.pan_number || existingEmployee.pan_number,
            govt_registration_number: updatedData.govt_registration_number || existingEmployee.govt_registration_number,
            pf_number: updatedData.pf_number || existingEmployee.pf_number,
            bank_name: updatedData.bank_name || existingEmployee.bank_name,
            ifsc_code: updatedData.ifsc_code || existingEmployee.ifsc_code,
            account_number: updatedData.account_number || existingEmployee.account_number,
            account_holder_name: updatedData.account_holder_name || existingEmployee.account_holder_name,
            upi_id: updatedData.upi_id || existingEmployee.upi_id
        };

        // Now, update the employee with merged data
        const updateSql = `
            UPDATE employees 
            SET name = ?, last_name = ?, email = ?, phone = ?, designation = ?, 
                join_date = ?, office_id = ?, status = ?, 
                father_name = ?, address = ?, city = ?, state = ?, postal_code = ?, 
                country = ?, gender = ?, dob = ?, marital_status = ?, blood_group = ?, 
                pan_number = ?, govt_registration_number = ?, pf_number = ?, 
                bank_name = ?, ifsc_code = ?, account_number = ?, account_holder_name= ?, upi_id = ?
            WHERE emp_id = ? AND admin_id = ?`;

        const values = [
            mergedData.name, mergedData.last_name, mergedData.email, mergedData.phone, mergedData.designation,
            mergedData.join_date, mergedData.office_id, mergedData.status,
            mergedData.father_name, mergedData.address, mergedData.city, mergedData.state, mergedData.postal_code,
            mergedData.country, mergedData.gender, mergedData.dob, mergedData.marital_status, mergedData.blood_group,
            mergedData.pan_number, mergedData.govt_registration_number, mergedData.pf_number,
            mergedData.bank_name, mergedData.ifsc_code, mergedData.account_number, mergedData.account_holder_name , mergedData.upi_id,
            emp_id, admin_id
        ];

        db.query(updateSql, values, (updateErr, result) => {
            if (updateErr) {
                console.error("Update Employee Error:", updateErr);
                return res.status(500).json({ error: "Failed to update employee details" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Employee not found or unauthorized update" });
            }

            res.json({ message: "Employee details updated successfully" });
        });
    });
};
