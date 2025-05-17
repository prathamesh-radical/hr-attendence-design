import db from '../db/db.js';
  export function addOrUpdateSalary(req, res) {
    const { 
      emp_id, 
      base_salary, 
      da, hra, ta, ma, pa, 
      others, 
      pf, pt, 
      other_deductions, 
      total_salary 
    } = req.body;
    
    const othersJson = others ? JSON.stringify(others) : '[]';
    const otherDeductionsJson = other_deductions ? JSON.stringify(other_deductions) : '[]';

    const sqlCheck = 'SELECT * FROM salary_structure WHERE emp_id = ?';
    db.query(sqlCheck, [emp_id], function (err, result) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const isUpdate = result.length > 0;
      const query = isUpdate
        ? `UPDATE salary_structure SET 
            base_salary = ?,
            da = ?,
            hra = ?,
            ta = ?,
            ma = ?,
            pa = ?,
            others = ?,
            pf = ?,
            pt = ?,
            other_deductions = ?,
            total_salary = ?
          WHERE emp_id = ?`
        : `INSERT INTO salary_structure 
          (emp_id, base_salary, da, hra, ta, ma, pa, others, pf, pt, other_deductions, total_salary)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = isUpdate
        ? [
            base_salary || 0,
            da || 0,
            hra || 0,
            ta || 0,
            ma || 0,
            pa || 0,
            othersJson,
            pf || 0,
            pt || 0,
            otherDeductionsJson,
            total_salary || 0,
            emp_id // emp_id at the end for WHERE clause in UPDATE
          ]
        : [
            emp_id, // emp_id at the start for INSERT
            base_salary || 0,
            da || 0,
            hra || 0,
            ta || 0,
            ma || 0,
            pa || 0,
            othersJson,
            pf || 0,
            pt || 0,
            otherDeductionsJson,
            total_salary || 0
          ];

      db.query(query, params, function (err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ message: `Salary details ${isUpdate ? 'updated' : 'added'} successfully` });
      });
    });
  }

  export const getSalaryByEmpId = (req, res) => {
    const { emp_id } = req.params;
  
    if (!emp_id) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
  
    const salaryQuery = 'SELECT * FROM salary_structure WHERE emp_id = ?';
    const historyQuery = 'SELECT id, base_salary, total_salary, increment_amount, increment_date, created_at FROM salary_history WHERE emp_id = ? ORDER BY created_at ASC';
  
    db.query(salaryQuery, [emp_id], (err, salaryResult) => {
      if (err) {
        console.error('Database error (salary):', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      let salaryData = {};
      if (salaryResult.length === 0) {
        salaryData = {
          base_salary: 0,
          da: 0,
          hra: 0,
          ta: 0,
          ma: 0,
          pa: 0,
          others: [],
          pf: 0,
          pt: 0,
          other_deductions: [],
          total_salary: 0,
          increment_amount: 0,
          increment_date: null,
        };
      } else {
        salaryData = salaryResult[0];
        try {
          salaryData.others = salaryData.others ? JSON.parse(salaryData.others) : [];
          salaryData.other_deductions = salaryData.other_deductions ? JSON.parse(salaryData.other_deductions) : [];
        } catch (e) {
          salaryData.others = [];
          salaryData.other_deductions = [];
        }
      }
  
      db.query(historyQuery, [emp_id], (err, historyResult) => {
        if (err) {
          console.error('Database error (history):', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        const salaryHistory = historyResult.map((row, index) => {
          let startDate;
          if (index === historyResult.length - 1) {
            startDate = salaryData.increment_date; // Last increment uses salary_structure
          } else {
            startDate = historyResult[index + 1].increment_date; // Earlier increments use next entry
          }
          let formattedDate = null;
          if (startDate) {
            const date = new Date(startDate);
            formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
          return {
            id: row.id,
            base_salary: row.base_salary || 0, // Add base_salary
            total_salary: row.total_salary || 0, // Add total_salary
            increment_amount: row.increment_amount || 0,
            increment_date: formattedDate,
          };
        });
  
        res.json({
          base_salary: salaryData.base_salary || 0,
          da: salaryData.da || 0,
          hra: salaryData.hra || 0,
          ta: salaryData.ta || 0,
          ma: salaryData.ma || 0,
          pa: salaryData.pa || 0,
          others: salaryData.others || [],
          pf: salaryData.pf || 0,
          pt: salaryData.pt || 0,
          other_deductions: salaryData.other_deductions || [],
          total_salary: salaryData.total_salary || 0,
          increment_amount: salaryData.increment_amount || 0,
          increment_date: salaryData.increment_date
            ? `${salaryData.increment_date.getFullYear()}-${String(salaryData.increment_date.getMonth() + 1).padStart(2, '0')}-${String(salaryData.increment_date.getDate()).padStart(2, '0')}`
            : null,
          salary_history: salaryHistory,
        });
      });
    });
  };
export function addSalaryIncrement(req, res) {
  const {
    emp_id,
    base_salary,
    da,
    hra,
    ta,
    ma,
    pa,
    others,
    pf,
    pt,
    other_deductions,
    total_salary,
    increment_amount,
    increment_date,
  } = req.body;

  const othersJson = JSON.stringify(others || []);
  const otherDeductionsJson = JSON.stringify(other_deductions || []);

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Transaction error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      connection.query('SELECT * FROM salary_structure WHERE emp_id = ?', [emp_id], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          });
        }

        if (result.length > 0) {
          const oldSalary = result[0];
          const historyQuery = `
            INSERT INTO salary_history 
            (emp_id, base_salary, da, hra, ta, ma, pa, others, pf, pt, other_deductions, total_salary, increment_amount, increment_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          // Use the old salary's increment_date (or null) as the end date, new increment_date for the new salary
          const historyIncrementDate = oldSalary.increment_date || null;

          connection.query(
            historyQuery,
            [
              emp_id,
              oldSalary.base_salary,
              oldSalary.da,
              oldSalary.hra,
              oldSalary.ta,
              oldSalary.ma,
              oldSalary.pa,
              oldSalary.others,
              oldSalary.pf,
              oldSalary.pt,
              oldSalary.other_deductions,
              oldSalary.total_salary,
              increment_amount || 0,
              historyIncrementDate, // Use previous increment_date (or null for initial)
            ],
            (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error('History insert error:', err);
                  res.status(500).json({ error: 'Internal server error' });
                });
              }

              updateSalary();
            }
          );
        } else {
          updateSalary();
        }

        function updateSalary() {
          const upsertQuery = result.length > 0
            ? `UPDATE salary_structure SET 
                base_salary = ?, da = ?, hra = ?, ta = ?, ma = ?, pa = ?, 
                others = ?, pf = ?, pt = ?, other_deductions = ?, 
                total_salary = ?, increment_amount = ?, increment_date = ?
               WHERE emp_id = ?`
            : `INSERT INTO salary_structure 
               (emp_id, base_salary, da, hra, ta, ma, pa, others, pf, pt, 
                other_deductions, total_salary, increment_amount, increment_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          const params = [
            base_salary || 0,
            da || 0,
            hra || 0,
            ta || 0,
            ma || 0,
            pa || 0,
            othersJson,
            pf || 0,
            pt || 0,
            otherDeductionsJson,
            total_salary || 0,
            increment_amount || 0,
            increment_date || null,
            emp_id,
          ];

          connection.query(upsertQuery, params, (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Salary update error:', err);
                res.status(500).json({ error: 'Internal server error' });
              });
            }

            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error('Commit error:', err);
                  res.status(500).json({ error: 'Internal server error' });
                });
              }
              connection.release();
              res.json({ message: 'Salary increment added successfully' });
            });
          });
        }
      });
    });
  });
}
export const getEmployeeStatusAndSalary = (req, res) => {
  const empId = req.params.empId;
  const { month } = req.query; // Format: YYYY-MM

  // console.log(`Processing request for empId: ${empId}, month: ${month}`);

  const currentSalaryQuery = `
    SELECT base_salary, da, hra, ta, ma, pa, others, pf, pt, other_deductions, total_salary, increment_amount, increment_date 
    FROM salary_structure 
    WHERE emp_id = ?`;

  const salaryHistoryQuery = `
    SELECT base_salary, da, hra, ta, ma, pa, others, pf, pt, other_deductions, total_salary, increment_amount, increment_date, created_at 
    FROM salary_history 
    WHERE emp_id = ? 
    ORDER BY increment_date ASC`;

  const employeeQuery = `SELECT admin_id, join_date FROM employees WHERE emp_id = ?`;
  const attendanceQuery = `
    SELECT status, DATE_FORMAT(date, '%Y-%m-%d') AS date  
    FROM attendance 
    WHERE emp_id = ? 
    AND DATE_FORMAT(date, '%Y-%m') = ?`;

  const leavesQuery = `SELECT leaveDays FROM leaves WHERE adminId = ?`;

  db.query(currentSalaryQuery, [empId], (err, currentSalaryResults) => {
    if (err) {
      // console.error('Error fetching current salary:', err);
      return res.status(500).json({ error: 'Failed to fetch current salary data' });
    }
    if (currentSalaryResults.length === 0) {
      // console.log(`No current salary found for empId: ${empId}`);
      return res.status(404).json({ error: 'Current salary not found' });
    }

    const currentSalary = currentSalaryResults[0];
    currentSalary.others = currentSalary.others ? JSON.parse(currentSalary.others) : [];
    currentSalary.other_deductions = currentSalary.other_deductions ? JSON.parse(currentSalary.other_deductions) : [];

    db.query(salaryHistoryQuery, [empId], (err, historyResults) => {
      if (err) {
        console.error('Error fetching salary history:', err);
        return res.status(500).json({ error: 'Failed to fetch salary history' });
      }

      // console.log(`Fetched ${historyResults.length} salary history records for empId: ${empId}`);

      const salaryHistory = historyResults.map(row => ({
        ...row,
        others: row.others ? JSON.parse(row.others) : [],
        other_deductions: row.other_deductions ? JSON.parse(row.other_deductions) : [],
        created_at: new Date(row.created_at),
        increment_date: row.increment_date ? new Date(row.increment_date) : null,
      }));

      const salaryTimeline = [
        ...salaryHistory,
        {
          ...currentSalary,
          created_at: currentSalary.increment_date ? new Date(currentSalary.increment_date) : new Date('9999-12-31'),
          increment_date: currentSalary.increment_date ? new Date(currentSalary.increment_date) : null,
        },
      ].sort((a, b) => {
        const dateA = a.increment_date || new Date('1970-01-01');
        const dateB = b.increment_date || new Date('1970-01-01');
        return dateA - dateB;
      });

      const requestedMonthStart = new Date(`${month}-01`);

      let applicableSalary = null;
      for (let i = salaryTimeline.length - 1; i >= 0; i--) {
        const currentEntry = salaryTimeline[i];
        const effectiveDate = currentEntry.increment_date || new Date('1970-01-01');
        if (effectiveDate <= requestedMonthStart) {
          applicableSalary = currentEntry;
          break;
        }
      }

      if (!applicableSalary) {
        console.log(`No applicable salary found for empId: ${empId}, month: ${month}`);
        applicableSalary = {
          base_salary: 0,
          total_salary: 0,
          da: 0,
          hra: 0,
          ta: 0,
          ma: 0,
          pa: 0,
          others: [],
          pf: 0,
          pt: 0,
          other_deductions: [],
          increment_amount: 0,
          increment_date: null,
        };
      }

      const baseSalary = applicableSalary.base_salary || 0;
      const totalSalary = applicableSalary.total_salary || 0;

      // console.log(`Applicable salary for empId: ${empId}, month: ${month}`, {
      //   base_salary: baseSalary,
      //   total_salary: totalSalary,
      // });

      db.query(employeeQuery, [empId], (err, employeeResults) => {
        if (err) {
          console.error('Error fetching employee data:', err);
          return res.status(500).json({ error: 'Failed to fetch employee data' });
        }
        if (employeeResults.length === 0) {
          console.log(`No employee found for empId: ${empId}`);
          return res.status(404).json({ error: 'Employee not found' });
        }

        const { admin_id, join_date } = employeeResults[0];
        const joinDate = new Date(join_date);

        // console.log(`Employee data for empId: ${empId}`, { admin_id, join_date: joinDate.toISOString().split('T')[0] });

        // Calculate the leave year
        const requestedYear = parseInt(month.split('-')[0]);
        const requestedMonthNum = parseInt(month.split('-')[1]);
        const joinMonth = joinDate.getMonth() + 1; // 1-12
        const joinDay = joinDate.getDate();

        let leaveYearStart, leaveYearEnd;
        if (
          requestedMonthNum > joinMonth ||
          (requestedMonthNum === joinMonth && new Date(`${month}-01`).getDate() >= joinDay)
        ) {
          leaveYearStart = new Date(requestedYear, joinMonth - 1, joinDay);
          leaveYearEnd = new Date(requestedYear + 1, joinMonth - 1, joinDay - 1);
        } else {
          leaveYearStart = new Date(requestedYear - 1, joinMonth - 1, joinDay);
          leaveYearEnd = new Date(requestedYear, joinMonth - 1, joinDay - 1);
        }

        const leaveYearStartStr = leaveYearStart.toISOString().split('T')[0];
        const leaveYearEndStr = leaveYearEnd.toISOString().split('T')[0];

        // console.log(`Leave year for empId: ${empId}`, { leaveYearStart: leaveYearStartStr, leaveYearEnd: leaveYearEndStr });

        db.query(leavesQuery, [admin_id], (err, leavesResults) => {
          if (err) {
            console.error('Error fetching leaves data:', err);
            return res.status(500).json({ error: 'Failed to fetch leaves data' });
          }
          const totalAllowedLeaves = leavesResults[0]?.leaveDays || 0;

          // console.log(`Leaves data for adminId: ${admin_id}`, { totalAllowedLeaves });

          // Query leaves taken in the leave year
          const leavesTakenQuery = `
            SELECT status, date
            FROM attendance
            WHERE emp_id = ?
            AND date >= ? AND date <= ?
            AND (status = 'Leave' OR status = 'Half-Day')`;

          db.query(leavesTakenQuery, [empId, leaveYearStartStr, leaveYearEndStr], (err, leavesTakenResults) => {
            if (err) {
              console.error('Error fetching leaves taken:', err);
              return res.status(500).json({ error: 'Failed to fetch leaves taken data' });
            }

            let leaveDaysInYear = 0;
            let halfDayLeavesInYear = 0;
            leavesTakenResults.forEach(row => {
              if (row.status === 'Leave') leaveDaysInYear++;
              if (row.status === 'Half-Day') halfDayLeavesInYear++;
            });
            const totalLeavesTakenInYear = leaveDaysInYear + (halfDayLeavesInYear * 0.5);
            const remainingLeaves = Math.max(0, totalAllowedLeaves - totalLeavesTakenInYear);

            // console.log(`Leaves taken in year for empId: ${empId}`, {
            //   leaveDaysInYear,
            //   halfDayLeavesInYear,
            //   totalLeavesTakenInYear,
            //   remainingLeaves,
            // });

            db.query(attendanceQuery, [empId, month], (err, attendanceResults) => {
              if (err) {
                console.error('Error fetching attendance data:', err);
                return res.status(500).json({ error: 'Failed to fetch attendance data' });
              }

              // console.log(`Fetched ${attendanceResults.length} attendance records for empId: ${empId}, month: ${month}`);

              const holidaysQuery = `
                SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date 
                FROM holidays 
                WHERE admin_id = ? 
                AND DATE_FORMAT(date, '%Y-%m') = ?`;

              db.query(holidaysQuery, [admin_id, month], (err, holidayResults) => {
                if (err) {
                  console.error('Error fetching holiday data:', err);
                  return res.status(500).json({ error: 'Failed to fetch holiday data' });
                }

                // console.log(`Fetched ${holidayResults.length} holidays for admin_id: ${admin_id}, month: ${month}`);

                const weekendsQuery = `SELECT day FROM weekends WHERE admin_id = ?`;
                db.query(weekendsQuery, [admin_id], (err, weekendResults) => {
                  if (err) {
                    console.error('Error fetching weekend data:', err);
                    return res.status(500).json({ error: 'Failed to fetch weekend data' });
                  }

                  // console.log(`Fetched weekends for admin_id: ${admin_id}`, weekendResults);

                  const totalDays = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
                  let presentDays = 0, leaveDays = 0, halfDayLeaves = 0, absentDays = 0;
                  let holidayDays = 0, weekendDays = 0;
                  let weekendDates = [];

                  const attendanceMap = {};
                  attendanceResults.forEach(item => {
                    attendanceMap[item.date] = item.status;
                  });

                  const weekendList = weekendResults.map(row => row.day.toLowerCase());

                  // Calculate attendance for the month
                  for (let day = 1; day <= totalDays; day++) {
                    let date = `${month}-${day.toString().padStart(2, '0')}`;
                    let dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

                    const isHoliday = holidayResults.some(h => h.date === date);
                    const isWeekend = weekendList.includes(dayOfWeek);

                    if (attendanceMap[date] === 'Present') {
                      presentDays++;
                    } else if (attendanceMap[date] === 'Leave') {
                      leaveDays++;
                    } else if (attendanceMap[date] === 'Half-Day') {
                      halfDayLeaves++;
                    } else if (attendanceMap[date] === 'Absent') {
                      absentDays++;
                    } else if (isHoliday) {
                      holidayDays++;
                    } else if (isWeekend) {
                      weekendDays++;
                      weekendDates.push(date);
                    } else {
                      absentDays++; // Unmarked days are absent
                    }
                  }

                  // Calculate leaves taken in the month
                  const totalLeavesTakenInMonth = leaveDays + (halfDayLeaves * 0.5);

                  // Determine paid and unpaid leave days
                  let paidLeaveDays = 0;
                  let unpaidLeaveDays = 0;

                  const leavesRemainingBeforeMonth = totalAllowedLeaves - (totalLeavesTakenInYear - totalLeavesTakenInMonth);
                  if (leavesRemainingBeforeMonth >= totalLeavesTakenInMonth) {
                    // All leaves in the month are paid
                    paidLeaveDays = leaveDays + (halfDayLeaves * 0.5);
                    unpaidLeaveDays = 0;
                  } else {
                    // Some leaves are unpaid
                    paidLeaveDays = leavesRemainingBeforeMonth;
                    unpaidLeaveDays = totalLeavesTakenInMonth - leavesRemainingBeforeMonth;
                  }

                  // console.log(`Leave calculation for empId: ${empId}, month: ${month}`, {
                  //   totalLeavesTakenInMonth,
                  //   leavesRemainingBeforeMonth,
                  //   paidLeaveDays,
                  //   unpaidLeaveDays,
                  // });

                  const totalPaidDays = presentDays + paidLeaveDays + holidayDays + weekendDays;
                  const perDaySalary = totalSalary / totalDays;
                  const netSalary = Math.round(totalPaidDays * perDaySalary);

                  // console.log(`Final calculation for empId: ${empId}, month: ${month}`, {
                  //   presentDays,
                  //   paidLeaveDays,
                  //   holidayDays,
                  //   weekendDays,
                  //   absentDays,
                  //   totalPaidDays,
                  //   netSalary,
                  // });

                  res.json({
                    base_salary: baseSalary,
                    total_salary: totalSalary,
                    increment_amount: applicableSalary.increment_amount || 0,
                    increment_date: applicableSalary.increment_date ? applicableSalary.increment_date.toISOString().split('T')[0] : null,
                    presentDays,
                    leaveDays, // Full leave days count
                    halfDayLeaves, // Half-day count
                    paidLeaveDays, // Total paid leave days (full + half)
                    holidayDays,
                    weekendDays,
                    absentDays,
                    totalPaidDays,
                    netSalary,
                    totalLeavesTaken: totalLeavesTakenInMonth,
                    totalLeavesTakenInYear,
                    remainingLeaves,
                    totalAllowedLeaves,
                    leaveYearStart: leaveYearStart.toISOString().split('T')[0],
                    leaveYearEnd: leaveYearEnd.toISOString().split('T')[0],
                    join_date: joinDate.toISOString().split('T')[0],
                    attendance: attendanceResults,
                    holidays: holidayResults,
                    weekends: weekendList,
                    weekendDates,
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

export const editIncrement=(req, res) => {
  const { id } = req.params;
  const {
    emp_id,
    base_salary,
    total_salary,
    increment_amount,
    increment_date,
    da,
    hra,
    ta,
    ma,
    pa,
    others,
    pf,
    pt,
    other_deductions,
  } = req.body;

  if (!emp_id || !increment_amount || !id) {
    return res.status(400).json({ error: 'Employee ID, increment amount, and increment ID are required' });
  }

  // Update salary_structure
  const updateSalaryQuery = `
    UPDATE salary_structure
    SET base_salary = ?, da = ?, hra = ?, ta = ?, ma = ?, pa = ?, others = ?, pf = ?, pt = ?, other_deductions = ?, total_salary = ?, increment_amount = ?, increment_date = ?
    WHERE emp_id = ?
  `;
  const salaryValues = [
    base_salary || 0,
    da || 0,
    hra || 0,
    ta || 0,
    ma || 0,
    pa || 0,
    JSON.stringify(others || []),
    pf || 0,
    pt || 0,
    JSON.stringify(other_deductions || []),
    total_salary || 0,
    increment_amount || 0,
    increment_date || null,
    emp_id,
  ];

  db.query(updateSalaryQuery, salaryValues, (err) => {
    if (err) {
      console.error('Database error (update salary_structure):', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Update only increment_amount in the latest salary_history entry
    const updateHistoryQuery = `
      UPDATE salary_history
      SET increment_amount = ?
      WHERE id = ? AND emp_id = ?
    `;
    db.query(updateHistoryQuery, [increment_amount || 0, id, emp_id], (err) => {
      if (err) {
        console.error('Database error (update salary_history):', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ message: 'Increment updated successfully' });
    });
  });
};
