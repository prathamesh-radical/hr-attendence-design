import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoute.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendenceRoute from './routes/attendenceRoute.js'
import adminRoute from './routes/adminRoute.js'
import salaryRoute from "./routes/salaryRoute.js"
import holidaysRoute from "./routes/holidaysRoute.js"
import weekendRoute from "./routes/weekendRoute.js"
import timingRoute from "./routes/timingRoutes.js"
import leavesRoutes from './routes/leavesRoutes.js'

import dotenv from "dotenv";




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", authRoutes);

app.get('/',(req,res)=>{
 res.send('HR ATTENDENCE BACKEND')
})

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendenceRoute);
app.use("/api/admins", adminRoute);
app.use("/api",salaryRoute)
app.use("/api/holiday",holidaysRoute)
app.use("/api/weekends",weekendRoute)
app.use("/api/timing",timingRoute)
app.use("/api/leaves",leavesRoutes)



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
