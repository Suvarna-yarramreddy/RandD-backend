const express = require("express");
// const mysql = require("mysql2");
const { Pool } = require("pg");

const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require('bcrypt');
const multer = require("multer");
const path = require('path');
require('dotenv').config();

const fs = require('fs');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// // MySQL Connection
// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password:  process.env.DB_PASSWORD, // Use .env for sensitive info
//     database: process.env.DB_NAME, // Use .env for the database name
// });
const db = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, // Usually 5432
    ssl: {
        rejectUnauthorized: false
    }
});


// db.connect((err) => {
//     if (err) {
//         console.error("Database connection failed:", err.stack);
//         return;
//     }
//     console.log("Connected to MySQL database.");
// });
db.connect()
    .then(() => console.log("Connected to PostgreSQL database."))
    .catch(err => console.error("Database connection failed:", err.stack));

app.get("/", (req, res) => {
    res.send("Server is running! Access the /signup endpoint with a POST request.");
});

// API Endpoint for Signup
app.post("/signup", (req, res) => {
    const {
        faculty_id,
        institute_name,
        faculty_name,
        department,
        designation,
        research_domain,
        major_specialization,
        research_skills,
        qualification,
        phd_status,
        phd_registration_date,
        phd_university,
        phd_completed_year,
        guide_name,
        guide_phone_number,
        guide_mail_id,
        guide_department,
        date_of_joining_svecw,
        experience_in_svecw,
        previous_teaching_experience,
        total_experience,
        industry_experience,
        ratified,
        official_mail_id,
        phone_number,
        course_network_id,
        faculty_profile_weblink,
        scopus_id,
        orcid,
        google_scholar_id,
        vidwan_portal,
        researcherid,
        password1
    } = req.body;
    const phdUniversity = phd_university || null;
    const phdRegistrationDate = phd_registration_date || null;
    const phdCompletedYear = phd_completed_year || null;
    // Validate required fields
    if (!faculty_id || !faculty_name || !official_mail_id || !department) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const query = `INSERT INTO faculty (
    faculty_id,
    institute_name,
    faculty_name,
    department,
    designation,
    research_domain,
    major_specialization,
    research_skills,
    qualification,
    phd_status,
    phd_registration_date,
    phd_university,
    phd_completed_year,
    guide_name,
    guide_phone_number,
    guide_mail_id,
    guide_department,
    date_of_joining_svecw,
    experience_in_svecw,
    previous_teaching_experience,
    total_experience,
    industry_experience,
    ratified,
    official_mail_id,
    phone_number,
    course_network_id,
    faculty_profile_weblink,
    scopus_id,
    orcid,
    google_scholar_id,
    vidwan_portal,
    researcherid,
    password1
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
    $31, $32, $33
)`;

    db.query(
        query,
        [
            faculty_id,
            institute_name,
            faculty_name,
            department,
            designation,
            research_domain,
            major_specialization,
            research_skills,
            qualification,
            phd_status,
            phdRegistrationDate,
            phdUniversity,
            phdCompletedYear,
            guide_name,
            guide_phone_number,
            guide_mail_id,
            guide_department,
            date_of_joining_svecw,
            experience_in_svecw,
            previous_teaching_experience,
            total_experience,
            industry_experience,
            ratified,
            official_mail_id,
            phone_number,
            course_network_id,
            faculty_profile_weblink,
            scopus_id,
            orcid,
            google_scholar_id,
            vidwan_portal,
            researcherid,
            password1
        ],
        (err, result) => {
            if (err) {
                console.log(err);
                if (err.code === "ER_DUP_ENTRY") {
                    res.status(400).json({ message: "Faculty ID or Official Mail ID already exists." });
                } else {
                    console.error("Database error:", err);
                    res.status(500).json({ message: "Database error." });
                }
            } else {
                res.status(201).json({ message: "Signup successful!", faculty_name,faculty_id });
            }
        }
    );
});

app.post("/login", (req, res) => {
  const { faculty_id, password1 } = req.body;

  if (!faculty_id || !password1) {
    return res.status(400).json({ message: "Faculty ID and password are required." });
  }

  const facultyQuery = `SELECT * FROM faculty WHERE faculty_id = $1`;

  db.query(facultyQuery, [faculty_id], (err, facultyResult) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error." });
    }

    if (facultyResult.rows.length === 0) {
      return res.status(400).json({ message: "Faculty ID not found. You must register to login." });
    }

    const loginQuery = `SELECT * FROM login WHERE faculty_id = $1`;

    db.query(loginQuery, [faculty_id], (err, loginResult) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error." });
      }

      if (loginResult.rows.length === 0) {
        const insertQuery = `INSERT INTO login (faculty_id, password) VALUES ($1, $2)`;

        db.query(insertQuery, [faculty_id, password1], (err, insertResult) => {
          if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({ message: "Error inserting faculty into login table." });
          }

          return res.status(200).json({
            message: "Faculty registered in login table, login successful.",
            faculty_name: facultyResult.rows[0].faculty_name,
            faculty_id,
          });
        });
      } else {
        if (loginResult.rows[0].password === password1) {
          return res.status(200).json({
            message: "Login successful.",
            faculty_name: facultyResult.rows[0].faculty_name,
            faculty_id,
          });
        } else {
          return res.status(400).json({ message: "Incorrect password." });
        }
      }
    });
  });
});

app.get('/api/stats/:facultyId', async (req, res) => {
  const { facultyId } = req.params;

  if (!facultyId) {
    return res.status(400).json({ message: 'Faculty ID is required' });
  }

  const queries = {
    total_publications: 'SELECT COUNT(*) AS count FROM publications WHERE faculty_id = $1',
    total_patents: 'SELECT COUNT(*) AS count FROM patents WHERE faculty_id = $1',
    total_seedmoney: 'SELECT COUNT(*) AS count FROM seedmoney WHERE faculty_id = $1',
    total_external: 'SELECT COUNT(*) AS count FROM fundedprojects WHERE faculty_id = $1',
    total_consultancy: 'SELECT COUNT(*) AS count FROM consultancy_projects WHERE faculty_id = $1',
    total_scholar: 'SELECT COUNT(*) AS count FROM research WHERE faculty_id = $1',
    total_proposal: 'SELECT COUNT(*) AS count FROM proposals WHERE faculty_id = $1',
  };

  try {
    const executeQuery = (query) =>
      new Promise((resolve, reject) => {
        db.query(query, [facultyId], (err, result) => {
          if (err) return reject(err);
          resolve(parseInt(result.rows?.[0]?.count || '0', 10));
        });
      });

    const stats = await Promise.all(
      Object.entries(queries).map(([_, query]) => executeQuery(query))
    );

    const response = Object.fromEntries(
      Object.keys(queries).map((key, idx) => [key, stats[idx]])
    );

    res.json(response);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  const storage = multer.diskStorage({
      destination: (req, file, cb) => {
          let dir;
  
          // Dynamically set upload directory based on the request URL
          if (req.url.includes('addPatent') || req.url.match(/update-patent\/\d+/)) {
              dir = './uploads/patents/';
          } else if (req.url.includes('addPublication') || req.url.match(/update-publication\/\d+/)) {
              dir = './uploads/publications/';
          } else if (req.url.includes('addSeedMoney') || req.url.match(/updateseedmoney\/\d+/)) {
              dir = './uploads/seedmoney/';
          }  else if (req.url.includes('addConsultancy') || req.url.match(/updateConsultancy\/\d+/)) {
            dir = './uploads/consultancy/';
        } else if (req.url.includes('addResearch') || req.url.match(/updatescholar\/\d+/)) {
            dir = './uploads/research/';
        }  else {
              dir = './uploads/others/'; // Default directory
          }
  
          // Ensure the directory exists, if not, create it
          if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
          }
  
          cb(null, dir);
      },
      filename: (req, file, cb) => {
          cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid name collisions
      }
  });
  
  // Initialize multer with the storage configuration
  const upload = multer({ storage });
  
  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));


  app.get('/facultyprofile/:facultyId', (req, res) => {
  const { facultyId } = req.params;

  const query = 'SELECT * FROM faculty WHERE faculty_id = $1';

  db.query(query, [facultyId], (err, result) => {
    if (err) {
      console.error('Error fetching faculty details:', err);
      return res.status(500).send('Error fetching data');
    }

    if (result.rows.length === 0) {
      return res.status(404).send('Faculty not found');
    }

    const faculty = result.rows[0];

    // Format date_of_joining_svecw to 'YYYY-MM-DD'
    if (faculty.date_of_joining_svecw) {
      faculty.date_of_joining_svecw = new Date(faculty.date_of_joining_svecw).toLocaleDateString('en-CA');
    }

    // Format phd_registration_date to 'YYYY-MM-DD'
    if (faculty.phd_registration_date) {
      faculty.phd_registration_date = new Date(faculty.phd_registration_date).toLocaleDateString('en-CA');
    }

    res.json(faculty);
  });
});


  
 app.put('/updatefacultyprofile/:facultyId', (req, res) => {
    const facultyId = req.params.facultyId;
    let updatedData = req.body;

    delete updatedData.facultyId; // Just in case it's sent in the body

    // Convert empty strings or undefined to null
    Object.keys(updatedData).forEach((key) => {
        if (updatedData[key] === undefined || updatedData[key] === '' || (typeof updatedData[key] === 'string' && updatedData[key].trim() === '')) {
            updatedData[key] = null;
        }
    });

    // Format date fields
    if (updatedData.date_of_joining_svecw) {
        updatedData.date_of_joining_svecw = new Date(updatedData.date_of_joining_svecw).toISOString().split('T')[0];
    }
    if (updatedData.phd_registration_date) {
        updatedData.phd_registration_date = new Date(updatedData.phd_registration_date).toISOString().split('T')[0];
    }

    // Build dynamic SET clause for PostgreSQL
    const keys = Object.keys(updatedData);
    const values = Object.values(updatedData);

    const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', '); // Add double quotes for safety

    const updateQuery = `UPDATE faculty SET ${setClause} WHERE faculty_id = $${keys.length + 1}`;

    db.query(updateQuery, [...values, facultyId], (err, result) => {
        if (err) {
            console.error("Database Update Error:", err);
            return res.status(500).send('Error updating faculty details');
        }
        res.send('Faculty details updated successfully');
    });
});



 app.post("/addPublication", upload.single("proofofpublication"), (req, res) => {
  const {
    faculty_id,
    natureofpublication,
    typeofpublication,
    titleofpaper,
    nameofjournalconference,
    titleofchapter,
    nameofbook,
    nameofpublisher,
    issnisbn,
    authorstatus,
    firstauthorname,
    firstauthoraffiliation,
    coauthors,
    indexed,
    quartile,
    impactfactor,
    doi,
    linkofpaper,
    scopuslink,
    volume,
    pageno,
    monthyear,
    citeas
  } = req.body;

  // Validate required fields
  if (!faculty_id || !natureofpublication || !typeofpublication) {
    return res.status(400).send("Faculty ID, Nature of Publication, and Type of Publication are required.");
  }

  // Journal-specific validations
  if (typeofpublication === "Journal") {
    if (!quartile || !impactfactor) {
      return res.status(400).send("Quartile and Impact Factor are required for Journal publications.");
    }
  } else {
    if (quartile || impactfactor) {
      return res.status(400).send("Quartile and Impact Factor should be empty for non-Journal publications.");
    }
  }

  const proofofpublication = req.file ? req.file.path : null;
  const status = "Applied";

  const query = `
    INSERT INTO publications (
      faculty_id, natureofpublication, typeofpublication, titleofpaper, nameofjournalconference, titleofchapter, nameofbook, 
      nameofpublisher, issnisbn, authorstatus, firstauthorname, firstauthoraffiliation, coauthors, indexed, quartile, impactfactor, 
      doi, linkofpaper, scopuslink, volume, pageno, monthyear, citeas, status, proofofpublication
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22, $23, $24, $25
    )`;

  const values = [
    faculty_id, natureofpublication, typeofpublication, titleofpaper, nameofjournalconference, titleofchapter, nameofbook,
    nameofpublisher, issnisbn, authorstatus, firstauthorname, firstauthoraffiliation, coauthors, indexed, quartile, impactfactor,
    doi, linkofpaper, scopuslink, volume, pageno, monthyear, citeas, status, proofofpublication
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error while inserting publication:", err);
      return res.status(500).send("Error while inserting publication");
    }
    res.status(200).send("Publication added successfully");
  });
});


app.get("/getPublications/:faculty_id", (req, res) => {
    const faculty_id = req.params.faculty_id;

    const query = `
        SELECT * FROM publications 
        WHERE faculty_id = $1
        AND (
            status = 'Approved by Institute R&D Coordinator' OR 
            status = 'Rejected by Institute R&D Coordinator' OR 
            status = 'Rejected by Department R&D Coordinator'
        )
    `;

    app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

    db.query(query, [faculty_id], (err, result) => {
        if (err) {
            console.error("Error fetching publications:", err);
            return res.status(500).json({ error: "Internal server error", details: err });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No publications found" });
        }

        // Normalize file path for client-side (e.g., convert backslashes to slashes)
        const publications = result.rows.map(pub => {
            if (pub.proofofpublication) {
                pub.proofofpublication = pub.proofofpublication.replace(/\\/g, '/');
            }
            return pub;
        });

        res.json(publications);
    });
});

app.put('/update-publication/:id', upload.single('proofofpublication'), (req, res) => {
    const publicationId = req.params.id;

    const fetchQuery = `SELECT * FROM publications WHERE publication_id = $1`;
    db.query(fetchQuery, [publicationId], (err, result) => {
        if (err) {
            console.error("Error fetching publication:", err);
            return res.status(500).json({ message: "Error fetching publication", error: err });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Publication not found" });
        }

        const existingData = result.rows[0]; // PostgreSQL stores columns in lowercase unless quoted

        // Use new values if provided, else fallback to existing
        const {
            faculty_id = existingData.faculty_id,
            natureofpublication = existingData.natureofpublication,
            typeofpublication = existingData.typeofpublication,
            titleofpaper = existingData.titleofpaper,
            nameofjournalconference = existingData.nameofjournalconference,
            titleofchapter = existingData.titleofchapter,
            nameofbook = existingData.nameofbook,
            nameofpublisher = existingData.nameofpublisher,
            issnisbn = existingData.issnisbn,
            authorstatus = existingData.authorstatus,
            firstauthorname = existingData.firstauthorname,
            firstauthoraffiliation = existingData.firstauthoraffiliation,
            coauthors = existingData.coauthors,
            indexed = existingData.indexed,
            quartile = existingData.quartile,
            impactfactor = existingData.impactfactor,
            doi = existingData.doi,
            linkofpaper = existingData.linkofpaper,
            scopuslink = existingData.scopuslink,
            volume = existingData.volume,
            pageno = existingData.pageno,
            monthyear = existingData.monthyear,
            citeas = existingData.citeas
        } = req.body;

        // File handling
        let proofofpublication = existingData.proofofpublication;
        if (req.file) {
            proofofpublication = path.join("uploads", "publications", req.file.filename).replace(/\\/g, '/');
        }

        const updateQuery = `
            UPDATE publications SET
                faculty_id = $1,
                natureofpublication = $2,
                typeofpublication = $3,
                titleofpaper = $4,
                nameofjournalconference = $5,
                titleofchapter = $6,
                nameofbook = $7,
                nameofpublisher = $8,
                issnisbn = $9,
                authorstatus = $10,
                firstauthorname = $11,
                firstauthoraffiliation = $12,
                coauthors = $13,
                indexed = $14,
                quartile = $15,
                impactfactor = $16,
                doi = $17,
                linkofpaper = $18,
                scopuslink = $19,
                volume = $20,
                pageno = $21,
                monthyear = $22,
                citeas = $23,
                proofofpublication = $24,
                status = 'Applied'
            WHERE publication_id = $25
        `;

        const values = [
            faculty_id, natureofpublication, typeofpublication, titleofpaper,
            nameofjournalconference, titleofchapter, nameofbook, nameofpublisher,
            issnisbn, authorstatus, firstauthorname, firstauthoraffiliation, coauthors,
            indexed, quartile, impactfactor, doi, linkofpaper, scopuslink, volume,
            pageno, monthyear, citeas, proofofpublication, publicationId
        ];

        db.query(updateQuery, values, (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating publication:", updateErr);
                return res.status(500).json({ message: "Failed to update publication", error: updateErr });
            }

            if (updateResult.rowCount === 0) {
                return res.status(404).json({ message: "Publication not found" });
            }

            res.json({ message: "Publication updated successfully" });
        });
    });
});


app.delete('/deletePublication/:id', async (req, res) => {
    const publicationId = req.params.id;

    try {
        const result = await db.query('DELETE FROM publications WHERE publication_id = $1', [publicationId]);

        if (result.rowCount === 0) {
            return res.status(404).send('Publication not found');
        }

        res.status(200).send('Publication deleted successfully');
    } catch (error) {
        console.error('Error deleting publication:', error);
        res.status(500).send('Failed to delete publication');
    }
});


// Route to add patent with file upload
app.post("/addPatent", upload.single('proofofpatent'), (req, res) => {
    const {
        faculty_id,
        category,
        iprtype,
        applicationnumber,
        applicantname,
        department,
        filingdate,
        inventiontitle,
        numofinventors,
        inventors,
        status1,
        dateofpublished,
        dateofgranted,
    } = req.body;

    const validDateOfPublished = dateofpublished && dateofpublished.trim() !== '' ? dateofpublished : null;
    const validDateOfGranted = dateofgranted && dateofgranted.trim() !== '' ? dateofgranted : null;

    const proofofpatent = req.file ? req.file.path.replace(/\\/g, "/") : null;

    if (!proofofpatent) {
        return res.status(400).send("Proof of patent file is required.");
    }

    const validNumOfInventors = numofinventors && !isNaN(numofinventors) ? numofinventors : 0;
    const validInventors = (Array.isArray(inventors) && inventors.length > 0) ? JSON.stringify(inventors) : null;
    const status = "Applied";

    const query = `
        INSERT INTO patents (
            faculty_id, category, iprtype, applicationnumber, applicantname, department,
            filingdate, inventiontitle, numofinventors, inventors,
            status1, dateofpublished, dateofgranted, proofofpatent, status
        ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14, $15
        )
    `;

    const values = [
        faculty_id, category, iprtype, applicationnumber, applicantname, department,
        filingdate, inventiontitle, validNumOfInventors, validInventors,
        status1, validDateOfPublished, validDateOfGranted, proofofpatent, status
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error inserting patent:", err);
            return res.status(500).send('Error while inserting patent');
        }
        res.status(200).send('Patent added successfully');
    });
});


app.get('/getPatents/:faculty_id', (req, res) => {
    const faculty_id = req.params.faculty_id;

    // PostgreSQL uses $1, $2, etc. as placeholders
    const query = `
        SELECT * FROM patents 
        WHERE faculty_id = $1 
        AND (
            status = 'Approved by Institute R&D Coordinator' OR 
            status = 'Rejected by Institute R&D Coordinator' OR 
            status = 'Rejected by Department R&D Coordinator'
        )
    `;

    // This should only be called once during server setup, not inside the route
    // Move this outside of the route if not already done
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    db.query(query, [faculty_id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send('Error fetching patents.');
        }

        const rows = result.rows;

        if (!rows || rows.length === 0) {
            return res.status(404).send('No patents found for this faculty.');
        }

        rows.forEach(patent => {
            if (patent.proofofpatent) {
                // Normalize path to avoid Windows backslash issues
                patent.proofofpatent = patent.proofofpatent.replace(/\\/g, '/');
            }
        });

        res.json(rows);
    });
});



// Function to convert ISO date to MySQL date format (YYYY-MM-DD)
const formatDate = (date) => {
    return date ? new Date(date).toISOString().split('T')[0] : null;
};
app.put('/update-patent/:id', upload.single('proofofpatent'), (req, res) => {
    const patent_id = req.params.id;

    const fetchQuery = "SELECT * FROM patents WHERE patent_id = $1";
    db.query(fetchQuery, [patent_id], (err, result) => {
        if (err) {
            console.error("Error fetching patent:", err);
            return res.status(500).json({ message: "Error fetching patent", error: err });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Patent not found" });
        }

        const existingData = result.rows[0];

        // Request body with fallback to existing data
        const {
            faculty_id = existingData.faculty_id,
            category = existingData.category,
            iprtype = existingData.iprtype,
            applicationnumber = existingData.applicationnumber,
            applicantname = existingData.applicantname,
            department = existingData.department,
            filingdate = existingData.filingdate,
            inventiontitle = existingData.inventiontitle,
            numofinventors = existingData.numofinventors,
            inventors = existingData.inventors,
            dateofpublished = existingData.dateofpublished,
            dateofgranted = existingData.dateofgranted
        } = req.body;

        // Format dates safely
        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return isNaN(date) ? null : date.toISOString().split('T')[0];
        };

        const formattedFilingDate = formatDate(filingdate);
        const formattedPublishedDate = formatDate(dateofpublished) || existingData.dateofpublished;
        const formattedGrantedDate = formatDate(dateofgranted);

        const parsedInventors = typeof inventors === 'string' ? inventors : JSON.stringify(inventors);
        const parsedNum = parseInt(numofinventors, 10) || 0;
        const proofofpatent = req.file
            ? path.join("uploads", "patents", req.file.filename).replace(/\\/g, '/')
            : existingData.proofofpatent;

        const updatedStatus = "Applied";

        const updateQuery = `
            UPDATE patents SET
                faculty_id = $1,
                category = $2,
                iprtype = $3,
                applicationnumber = $4,
                applicantname = $5,
                department = $6,
                filingdate = $7,
                inventiontitle = $8,
                numofinventors = $9,
                inventors = $10,
                status = $11,
                dateofpublished = $12,
                dateofgranted = $13,
                proofofpatent = $14
            WHERE patent_id = $15
        `;

        const values = [
            faculty_id,
            category,
            iprtype,
            applicationnumber,
            applicantname,
            department,
            formattedFilingDate,
            inventiontitle,
            parsedNum,
            parsedInventors,
            updatedStatus,
            formattedPublishedDate,
            formattedGrantedDate,
            proofofpatent,
            patent_id
        ];

        db.query(updateQuery, values, (err, updateResult) => {
            if (err) {
                console.error("Error updating patent:", err);
                return res.status(500).json({ message: "Failed to update patent", error: err });
            }

            if (updateResult.rowCount === 0) {
                return res.status(404).json({ message: "Patent not found or unchanged" });
            }

            res.json({ message: "Patent updated successfully. Status set to 'Applied'." });
        });
    });
});

app.delete('/deletePatent/:id', (req, res) => {
    const patentId = req.params.id;

    const deleteQuery = 'DELETE FROM patents WHERE patent_id = $1';

    db.query(deleteQuery, [patentId], (err, result) => {
        if (err) {
            console.error('Error deleting patent:', err);
            return res.status(500).send('Failed to delete patent');
        }

        if (result.rowCount === 0) {
            return res.status(404).send('Patent not found');
        }

        res.status(200).send('Patent deleted successfully');
    });
});


app.post("/addSeedMoney", upload.array("proof", 5), (req, res) => {
    try {
        const {
            faculty_id,
            financialyear,
            facultyname,
            department,
            numstudents,
            projecttitle,
            amountsanctioned,
            objectives,
            outcomes,
            students
        } = req.body;

        const proofUrls = req.files.map(file => `uploads/seedmoney/${file.filename}`);

        const amountreceived = req.body.amountreceived && req.body.amountreceived.trim() !== ''
            ? req.body.amountreceived
            : null;

        let parsedStudents;
        try {
            parsedStudents = typeof students === "string" ? JSON.parse(students) : students;
        } catch (error) {
            console.error("Invalid students JSON:", students);
            return res.status(400).json({ error: "Invalid students format" });
        }

        const query = `
            INSERT INTO SeedMoney (
                faculty_id, financialyear, facultyname, department, numstudents,
                projecttitle, amountsanctioned, amountreceived, objectives, outcomes,
                students, proof
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12
            ) RETURNING seedmoney_id`;

        const values = [
            faculty_id, financialyear, facultyname, department, numstudents,
            projecttitle, amountsanctioned, amountreceived, objectives, outcomes,
            JSON.stringify(parsedStudents), JSON.stringify(proofUrls)
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error inserting SeedMoney:", err);
                return res.status(500).json({ error: "Error while inserting SeedMoney" });
            }
            res.status(200).json({
                message: "SeedMoney added successfully",
                seedMoneyId: result.rows[0].seedmoney_id
            });
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Unexpected error occurred" });
    }
});

app.get("/getSeedMoney/:faculty_id", (req, res) => {
    const { faculty_id } = req.params;

    const query = `SELECT * FROM SeedMoney WHERE faculty_id = $1`;
    db.query(query, [faculty_id], (err, result) => {
        if (err) {
            console.error("Error fetching SeedMoney records:", err);
            return res.status(500).json({ error: "Error fetching SeedMoney records" });
        }

        const records = result.rows;

        if (records.length === 0) {
            return res.status(404).json({ message: "No SeedMoney records found." });
        }

        // Fill missing fields for consistency
        records.forEach(record => {
            record.students = record.students || "No students";
            record.proof = record.proof || "No proof available";
        });

        res.json(records);
    });
});


app.put('/updateseedmoney/:seedmoney_id', upload.array('proof'), (req, res) => {
    const { seedmoney_id } = req.params;
    const {
        financialyear, facultyname, department, numstudents, projecttitle,
        amountsanctioned, amountreceived, objectives, outcomes, students
    } = req.body;

    let studentsData;
    try {
        studentsData = JSON.parse(students);
    } catch (error) {
        return res.status(400).json({ message: "Invalid students format" });
    }

    // Fetch existing proof only if new files are not uploaded
    const selectQuery = `SELECT proof FROM seedmoney WHERE seedmoney_id = $1`;
    db.query(selectQuery, [seedmoney_id], (selectErr, result) => {
        if (selectErr) return res.status(500).send(selectErr);

        let existingProofs = [];

        if (result.rows.length > 0 && result.rows[0].proof) {
            try {
                const proofData = result.rows[0].proof;
                if (typeof proofData === "string" && proofData.trim() !== "") {
                    existingProofs = JSON.parse(proofData);
                    if (!Array.isArray(existingProofs)) throw new Error("Invalid proof format");
                }
            } catch (error) {
                console.error("Proof parse error:", error);
                existingProofs = [];
            }
        }

        // If new files are uploaded, append them
        let updatedProofs = existingProofs;
        if (req.files && req.files.length > 0) {
            const newProofs = req.files.map(file => `uploads/seedmoney/${file.filename}`);
            updatedProofs = [...existingProofs, ...newProofs];
        }

        const updateQuery = `
            UPDATE seedmoney 
            SET financialyear = $1, facultyname = $2, department = $3, numstudents = $4, projecttitle = $5, 
                amountsanctioned = $6, amountreceived = $7, objectives = $8, outcomes = $9, students = $10, proof = $11
            WHERE seedmoney_id = $12
        `;

        const values = [
            financialyear, facultyname, department, numstudents, projecttitle,
            amountsanctioned, amountreceived, objectives, outcomes,
            JSON.stringify(studentsData), JSON.stringify(updatedProofs), seedmoney_id
        ];

        db.query(updateQuery, values, (updateErr) => {
            if (updateErr) return res.status(500).send(updateErr);
            res.send("Updated successfully!");
        });
    });
});

app.delete('/deleteSeedmoney/:seedmoney_id', async (req, res) => {
    const seedMoneyId = req.params.id;

    try {
        await db.query('DELETE FROM seedmoney WHERE seedmoney_id = $1', [seedMoneyId]);
        res.status(200).send('Seedmoney deleted successfully');
    } catch (error) {
        console.error('Error deleting seedmoney:', error);
        res.status(500).send('Failed to delete seedmoney');
    }
});




app.post('/addFundedProject', (req, res) => {
    const {
        faculty_id, financialyear, applicationnumber, agency, scheme, piname, pidept, picontact, piemail,
        copiname, copidept, copicontact, copiemail, duration, title, status, startdate, objectives, outcomes,
        amountapplied, amountreceived, amountsanctioned, totalexpenditure
    } = req.body;

    // Convert empty values to null
    const sanitizedAmountSanctioned = amountsanctioned === '' ? null : amountsanctioned;
    const sanitizedAmountApplied = amountapplied === '' ? null : amountapplied;
    const sanitizedamountreceived = amountreceived === '' ? null : amountreceived;
    const sanitizedTotalExpenditure = totalexpenditure === '' ? null : totalexpenditure;

    const sql = `
        INSERT INTO fundedprojects 
        (faculty_id, financialyear, applicationnumber, agency, scheme, piname, pidept, picontact, piemail, 
         copiname, copidept, copicontact, copiemail, duration, title, status, startdate, objectives, outcomes, 
         amountapplied, amountreceived, amountsanctioned, totalexpenditure) 
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19,
            $20, $21, $22, $23
        ) RETURNING project_id
    `;

    db.query(sql, [
        faculty_id, financialyear, applicationnumber, agency, scheme, piname, pidept, picontact, piemail,
        copiname, copidept, copicontact, copiemail, duration, title, status, startdate, objectives, outcomes,
        sanitizedAmountApplied, sanitizedamountreceived, sanitizedAmountSanctioned, sanitizedTotalExpenditure
    ], (err, result) => {
        if (err) {
            console.error("Error inserting project:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        res.status(201).json({
            message: "Project added successfully",
            projectId: result.rows[0].project_id
        });
    });
});


app.get('/getFundedProjects/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM fundedprojects WHERE faculty_id = $1';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching projects:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        // Format startdate to 'YYYY-MM-DD'
        const formattedRows = result.rows.map(project => {
            if (project.startdate) {
                const date = new Date(project.startdate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                project.startdate = `${year}-${month}-${day}`;
            }
            return project;
        });

        res.status(200).json(formattedRows);
    });
});



app.put("/updateFundedProject/:project_id", (req, res) => {
  const { project_id } = req.params;
  const {
    financialyear, applicationnumber, agency, scheme, piname, pidept, picontact, piemail,
    copiname, copidept, copicontact, copiemail, duration, title, status,
    startdate, objectives, outcomes, amountapplied, amountreceived,
    amountsanctioned, totalexpenditure
  } = req.body;

  const parseNumber = (value) => (value === "" || value === undefined ? null : parseFloat(value));
  const formattedStartDate = startdate ? new Date(startdate).toISOString().split('T')[0] : null;

  const sql = `
    UPDATE fundedprojects SET 
      financialyear = $1,
      applicationnumber = $2,
      agency = $3,
      scheme = $4,
      piname = $5,
      pidept = $6,
      picontact = $7,
      piemail = $8,
      copiname = $9,
      copidept = $10,
      copicontact = $11,
      copiemail = $12,
      duration = $13,
      title = $14,
      status = $15,
      startdate = $16,
      objectives = $17,
      outcomes = $18,
      amountapplied = $19,
      amountreceived = $20,
      amountsanctioned = $21,
      totalexpenditure = $22
    WHERE project_id = $23
  `;

  const values = [
    financialyear, applicationnumber, agency, scheme, piname, pidept, picontact, piemail,
    copiname, copidept, copicontact, copiemail, duration, title, status,
    formattedStartDate, objectives, outcomes,
    parseNumber(amountapplied),
    parseNumber(amountreceived),
    parseNumber(amountsanctioned),
    parseNumber(totalexpenditure),
    project_id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating funded project:", err);
      return res.status(500).json({ error: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Funded project not found" });
    }

    res.json({ message: "Funded Project updated successfully" });
  });
});

app.delete('/deletefundedproject/:id', async (req, res) => {
    const externalId = req.params.id;
    try {
        const sql = 'DELETE FROM fundedprojects WHERE project_id = $1';
        db.query(sql, [externalId], (err, result) => {
            if (err) {
                console.error('Error deleting funded project:', err);
                return res.status(500).send('Failed to delete funded project');
            }

            if (result.rowCount === 0) {
                return res.status(404).send('Funded project not found');
            }

            res.status(200).send('Funded project deleted successfully');
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send('Server error');
    }
});


app.post('/addConsultancy', upload.array('report', 10), (req, res) => {
    const {
        faculty_id, financialyear, department, startdateofproject, numoffaculty, titleofconsultancy,
        domainofconsultancy, clientorganization, clientaddress, amountreceived, dateofamountreceived,
        facilities, faculties
    } = req.body;

    if (!faculty_id) {
        return res.status(400).json({ error: "Faculty ID is required" });
    }

    // Format file paths
    const reportJson = JSON.stringify(req.files.map(file => `uploads/consultancy/${file.filename}`));

    // Format faculties
    let facultiesJson;
    try {
        facultiesJson = Array.isArray(faculties) ? JSON.stringify(faculties) : faculties;
    } catch (error) {
        return res.status(400).json({ error: "Invalid faculties data" });
    }

    const sanitizedamountreceived = amountreceived === '' ? null : amountreceived;

    const sql = `
        INSERT INTO consultancy_projects 
        (faculty_id, financialyear, department, startdateofproject, numoffaculty, titleofconsultancy, 
         domainofconsultancy, clientorganization, clientaddress, amountreceived, dateofamountreceived, 
         facilities, report, faculties) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    const values = [
        faculty_id, financialyear, department, startdateofproject, numoffaculty, titleofconsultancy,
        domainofconsultancy, clientorganization, clientaddress, sanitizedamountreceived, dateofamountreceived,
        facilities, reportJson, facultiesJson
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting consultancy project:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.status(201).json({ message: "Consultancy project added successfully" });
    });
});

app.get('/getConsultancy/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM consultancy_projects WHERE faculty_id = $1";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching consultancy projects:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        const formattedProjects = result.rows.map(project => {
            if (project.startdateofproject) {
                project.startdateofproject = new Date(project.startdateofproject).toLocaleDateString('en-CA');
            }
            if (project.dateofamountreceived) {
                project.dateofamountreceived = new Date(project.dateofamountreceived).toLocaleDateString('en-CA');
            }
            return project;
        });

        res.status(200).json(formattedProjects);
    });
});

app.put('/updateConsultancy/:id', upload.array('report'), async (req, res) => {
    const { id } = req.params;
    const {
        financialyear, department, startdateofproject, numoffaculty,
        titleofconsultancy, domainofconsultancy, clientorganization, clientaddress,
        amountreceived, dateofamountreceived, facilities, faculties
    } = req.body;

    let report = [];

    if (req.files && req.files.length > 0) {
        // Use newly uploaded report files
        report = req.files.map(file => file.path.replace(/\\/g, "/"));
    } else {
        // No new files uploaded, fetch existing report from DB
        try {
            const existing = await db.query(
                'SELECT report FROM consultancy_projects WHERE consultancy_id = $1',
                [id]
            );
            if (existing.rows.length > 0 && existing.rows[0].report) {
                report = existing.rows[0].report;
            }
        } catch (err) {
            console.error("Error fetching existing report:", err);
            return res.status(500).json({ message: "Failed to fetch existing report" });
        }
    }

    const updateQuery = `
        UPDATE consultancy_projects SET
            financialyear = $1,
            department = $2,
            startdateofproject = $3,
            numoffaculty = $4,
            titleofconsultancy = $5,
            domainofconsultancy = $6,
            clientorganization = $7,
            clientaddress = $8,
            amountreceived = $9,
            dateofamountreceived = $10,
            facilities = $11,
            faculties = $12,
            report = $13
        WHERE consultancy_id = $14
    `;

    const values = [
        financialyear, department, startdateofproject, numoffaculty,
        titleofconsultancy, domainofconsultancy, clientorganization, clientaddress,
        amountreceived === '' ? null : amountreceived,
        dateofamountreceived, facilities,
        Array.isArray(faculties) ? JSON.stringify(faculties) : faculties,
        JSON.stringify(report),
        id
    ];

    db.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error("Error updating consultancy project:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json({ message: "Project updated successfully" });
    });
});


app.delete('/deleteConsultancy/:id', (req, res) => {
    const consultancy_id = req.params.id;

    const deleteQuery = 'DELETE FROM consultancy_projects WHERE consultancy_id = $1';

    db.query(deleteQuery, [consultancy_id], (err, result) => {
        if (err) {
            console.error('Error deleting Consultancy:', err);
            return res.status(500).send('Failed to delete Consultancy');
        }

        if (result.rowCount === 0) {
            return res.status(404).send('Consultancy not found');
        }

        res.status(200).send('Consultancy deleted successfully');
    });
});


  
app.post("/addResearch", upload.fields([
    { name: "admissionletter", maxCount: 1 },
    { name: "guideallotmentletter", maxCount: 1 },
    { name: "completionproceedings", maxCount: 1 }
]), (req, res) => {
    const {
        faculty_id,
        guidename,
        guidedepartment,
        scholarname,
        scholardepartment,
        admissiondate,
        university,
        worktitle,
        admissionstatus,
        awarddate,
        fellowship
    } = req.body;


    const admissionletter = req.files["admissionletter"] ? req.files["admissionletter"][0].path : null;
    const guideallotmentletter = req.files["guideallotmentletter"] ? req.files["guideallotmentletter"][0].path : null;
    const completionproceedings = req.files["completionproceedings"] ? req.files["completionproceedings"][0].path : null;

    const formattedAwardDate = awarddate && awarddate.trim() !== "" ? awarddate : null;

    const query = `
        INSERT INTO research (
            faculty_id, guidename, guidedepartment, scholarname, scholardepartment, admissiondate,
            university, worktitle, admissionstatus, awarddate, fellowship,
            admissionletter, guideallotmentletter, completionproceedings
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14
        )
    `;

    const values = [
        faculty_id, guidename, guidedepartment, scholarname, scholardepartment, admissiondate,
        university, worktitle, admissionstatus, formattedAwardDate, fellowship,
        admissionletter, guideallotmentletter, completionproceedings
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error inserting research data:", err);
            return res.status(500).send("Error while inserting research data");
        }
        res.status(200).send("Research Scholar data added successfully");
    });
});

app.get('/getscholars/:faculty_id', (req, res) => {
    const faculty_id = req.params.faculty_id;
    const query = `SELECT * FROM research WHERE faculty_id = $1`;

    db.query(query, [faculty_id], (err, results) => {
        if (err) {
            console.error('Error fetching scholars:', err);
            return res.status(500).json({ error: 'Failed to fetch research scholars' });
        }
        res.json(results.rows); // PostgreSQL returns results under `.rows`
    });
});


app.put("/updatescholar/:id", upload.fields([
    { name: "admissionletter", maxCount: 1 },
    { name: "guideallotmentletter", maxCount: 1 },
    { name: "completionproceedings", maxCount: 1 }
]), (req, res) => {
    const { id } = req.params;
    const {
        worktitle, guidename, guidedepartment, scholarname, scholardepartment,
        admissiondate, university, admissionstatus, awarddate, fellowship
    } = req.body;

    // Step 1: Fetch existing file paths
    const fetchQuery = `SELECT admissionletter, guideallotmentletter, completionproceedings FROM research WHERE id = $1`;
    db.query(fetchQuery, [id], (fetchErr, fetchResult) => {
        if (fetchErr) {
            console.error("Error fetching existing files:", fetchErr);
            return res.status(500).json({ error: fetchErr.message });
        }

        const oldFiles = fetchResult.rows[0];

        // Step 2: Determine new or fallback file paths
        const admissionletterPath = req.files["admissionletter"]
            ? `uploads/research/${req.files["admissionletter"][0].filename}`
            : oldFiles.admissionletter;

        const guideallotmentletterPath = req.files["guideallotmentletter"]
            ? `uploads/research/${req.files["guideallotmentletter"][0].filename}`
            : oldFiles.guideallotmentletter;

        const completionproceedingsPath = req.files["completionproceedings"]
            ? `uploads/research/${req.files["completionproceedings"][0].filename}`
            : oldFiles.completionproceedings;

        // Step 3: Update query
        const updateQuery = `
            UPDATE research SET 
                worktitle = $1,
                guidename = $2,
                guidedepartment = $3,
                scholarname = $4,
                scholardepartment = $5,
                admissiondate = $6,
                university = $7,
                admissionstatus = $8,
                awarddate = $9,
                fellowship = $10,
                admissionletter = $11,
                guideallotmentletter = $12,
                completionproceedings = $13
            WHERE id = $14
        `;

        const values = [
            worktitle, guidename, guidedepartment, scholarname, scholardepartment,
            admissiondate, university, admissionstatus, awarddate, fellowship,
            admissionletterPath, guideallotmentletterPath, completionproceedingsPath,
            id
        ];

        db.query(updateQuery, values, (updateErr) => {
            if (updateErr) {
                console.error("Error updating scholar:", updateErr);
                return res.status(500).json({ error: updateErr.message });
            }

            res.json({ message: "Scholar updated successfully" });
        });
    });
});

app.delete('/deleteScholar/:id', async (req, res) => {
    const id = req.params.id;
    try {
        db.query('DELETE FROM research WHERE id = $1', [id], (err, result) => {
            if (err) {
                console.error('Error deleting Scholar:', err);
                return res.status(500).send('Failed to delete Scholar');
            }

            if (result.rowCount === 0) {
                return res.status(404).send('Scholar not found');
            }

            res.status(200).send('Research Scholar deleted successfully');
        });
    } catch (error) {
        console.error('Error deleting Scholar:', error);
        res.status(500).send('Failed to delete Scholar');
    }
});



app.post("/addProposal", async (req, res) => {
    try {
        const {
            faculty_id, referencenumber, agencyscheme, submissionyear, submissiondate,
            piname, pidepartment, pidesignation, piphone, piemail, projecttitle,
            amountrequested, projectstatus
        } = req.body;

        const query = `
            INSERT INTO proposals 
            (faculty_id, referencenumber, agencyscheme, submissionyear, submissiondate, 
            piname, pidepartment, pidesignation, piphone, piemail, projecttitle, 
            amountrequested, projectstatus) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
        `;

        db.query(query, [
            faculty_id, referencenumber, agencyscheme, submissionyear, submissiondate,
            piname, pidepartment, pidesignation, piphone, piemail, projecttitle,
            amountrequested, projectstatus
        ], (err, result) => {
            if (err) {
                console.error("Error inserting proposal data:", err);
                return res.status(500).json({ error: "Error while inserting proposal data" });
            }

            res.status(201).json({ message: "Proposal added successfully", id: result.rows[0].id });
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get Proposals
app.get('/getProposals/:faculty_id', async (req, res) => {
    try {
        const { faculty_id } = req.params;
        const query = `SELECT * FROM proposals WHERE faculty_id = $1`;

        db.query(query, [faculty_id], (err, result) => {
            if (err) {
                console.error('Error fetching proposals:', err);
                return res.status(500).json({ error: 'Failed to fetch proposals' });
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "No proposals found" });
            }

            const formattedProposals = result.rows.map(proposal => {
                if (proposal.submissiondate) {
                    proposal.submissiondate = new Date(proposal.submissiondate).toLocaleDateString('en-CA'); // YYYY-MM-DD
                }
                return proposal;
            });

            res.status(200).json(formattedProposals);
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Update Proposal
app.put('/updateProposal/:id', (req, res) => {
    const { id } = req.params;
    const { 
        referencenumber, agencyscheme, submissionyear, submissiondate, piname, pidepartment, pidesignation, 
        piphone, piemail, projecttitle, amountrequested, projectstatus 
    } = req.body;

    // Convert empty/undefined/NaN numeric fields to NULL
    const convertToNull = (value) => (value === "" || value === undefined || isNaN(value) ? null : value);

    const query = `
        UPDATE proposals SET 
            referencenumber = $1,
            agencyscheme = $2,
            submissionyear = $3,
            submissiondate = $4,
            piname = $5,
            pidepartment = $6,
            pidesignation = $7,
            piphone = $8,
            piemail = $9,
            projecttitle = $10,
            amountrequested = $11,
            projectstatus = $12
        WHERE id = $13
    `;

    const values = [
        referencenumber,
        agencyscheme,
        submissionyear,
        submissiondate,
        piname,
        pidepartment,
        pidesignation,
        piphone,
        piemail,
        projecttitle,
        convertToNull(amountrequested),
        projectstatus,
        id
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error updating Proposal:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: "Proposal updated successfully" });
    });
});


app.delete('/deleteproposal/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const result = await db.query('DELETE FROM proposals WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        res.status(200).send('Project Proposal deleted successfully');
    } catch (error) {
        console.error('Error deleting Proposal:', error);
        res.status(500).send('Failed to delete Proposal');
    }
});

app.post('/coordinatorlogin', (req, res) => {
    const { coordinatorid, password1, department } = req.body;

    // PostgreSQL query uses $1, $2 as placeholders
    const query = 'SELECT * FROM depcorlogin WHERE coordinatorid = $1 AND department = $2';

    db.query(query, [coordinatorid, department], (err, result) => {
        if (err) {
            console.error('Error fetching data:', err.stack);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (result.rows.length > 0) {
            const coordinator = result.rows[0];
            if (coordinator.password === password1) {
                res.status(200).json({ success: true, coordinatorid: coordinator.coordinatorid });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

  app.get('/api/stats/department/:coordinatorId', async (req, res) => {
    const { coordinatorId } = req.params;

    // PostgreSQL query to fetch department
    const getDepartmentQuery = 'SELECT department FROM depcorlogin WHERE coordinatorid = $1';

    // Queries for department-level stats
    const queries = {
        total_faculty: 'SELECT COUNT(*) AS count FROM faculty WHERE department = $1',
        total_publications: 'SELECT COUNT(*) AS count FROM publications WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
        total_patents: 'SELECT COUNT(*) AS count FROM patents WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
        total_seedmoney: 'SELECT COUNT(*) AS count FROM seedmoney WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
        total_external: 'SELECT COUNT(*) AS count FROM fundedprojects WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
        total_consultancy: 'SELECT COUNT(*) AS count FROM consultancy_projects WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
        total_scholar: 'SELECT COUNT(*) AS count FROM research WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
        total_proposal: 'SELECT COUNT(*) AS count FROM proposals WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE department = $1)',
    };

    try {
        // Get department name
        const result = await db.query(getDepartmentQuery, [coordinatorId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator not found' });
        }

        const department = result.rows[0].department;

        // Function to execute stats queries
        const executeQuery = (query, param) =>
            new Promise((resolve, reject) => {
                db.query(query, [param], (err, result) => {
                    if (err) return reject(err);
                    resolve(parseInt(result.rows[0].count, 10));
                });
            });

        const stats = await Promise.all(
            Object.entries(queries).map(([key, query]) => executeQuery(query, department))
        );

        const response = {
            total_faculty: stats[0],
            total_publications: stats[1],
            total_patents: stats[2],
            total_seedmoney: stats[3],
            total_external: stats[4],
            total_consultancy: stats[5],
            total_scholar: stats[6],
            total_proposal: stats[7],
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching department statistics:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

 app.get('/getAllPublications', async (req, res) => {
    const coordinatorId = req.query.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).send('Coordinator ID is required.');
    }

    try {
        // Step 1: Get coordinator's department
        const coordinatorQuery = `
            SELECT department
            FROM depcorlogin
            WHERE coordinatorid = $1
        `;
        const coordinatorResult = await db.query(coordinatorQuery, [coordinatorId]);

        if (coordinatorResult.rows.length === 0) {
            return res.status(404).send('Coordinator not found.');
        }

        const coordinatorDepartment = coordinatorResult.rows[0].department;

        // Step 2: Get publications for that department with status "Applied"
        const publicationsQuery = `
            SELECT p.*
            FROM publications p
            JOIN faculty f ON p.faculty_id = f.faculty_id
            WHERE p.status = 'Applied' AND f.department = $1
        `;
        const publicationsResult = await db.query(publicationsQuery, [coordinatorDepartment]);

        if (publicationsResult.rows.length === 0) {
            return res.status(404).send('No publications applied for approval.');
        }

        // Normalize file paths
        const publications = publicationsResult.rows.map(pub => {
            if (pub.proofofpublication) {
                pub.proofofpublication = pub.proofofpublication.replace(/\\/g, '/');
            }
            return pub;
        });

        res.json(publications);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal server error.');
    }
});



// Route to approve a publication
app.put('/approvePublication/:id', (req, res) => {
    const publicationId = req.params.id;

    const query = 'UPDATE publications SET status = $1 WHERE publication_id = $2';

    db.query(query, ['Approved by Department R&D Coordinator', publicationId], (err, result) => {
        if (err) {
            console.error('Error during approval:', err);
            return res.status(500).json({ error: 'Failed to approve publication' });
        }

        if (result.rowCount > 0) {
            return res.status(200).json({ message: 'Publication approved successfully' });
        } else {
            return res.status(404).json({ error: 'Publication not found' });
        }
    });
});

app.put('/rejectPublication/:publicationId', (req, res) => {
    const publicationId = req.params.publicationId;
    const rejectionReason = req.body.rejectionReason;

    // Validate input
    if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const query = `
        UPDATE publications 
        SET status = $1, rejection_reason = $2 
        WHERE publication_id = $3
    `;

    db.query(
        query,
        ['Rejected by Department R&D Coordinator', rejectionReason, publicationId],
        (error, result) => {
            if (error) {
                console.error('Error during rejection:', error);
                return res.status(500).json({ message: 'Failed to reject publication' });
            }

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Publication not found' });
            }

            res.status(200).json({ message: 'Publication rejected successfully' });
        }
    );
});


app.get('/getAllPatents', (req, res) => {
    const coordinatorId = req.query.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).send('Coordinator ID is required.');
    }

    // Step 1: Fetch the coordinator's department
    const coordinatorDepartmentQuery = `
        SELECT department
        FROM depcorlogin
        WHERE coordinatorid = $1;
    `;

    db.query(coordinatorDepartmentQuery, [coordinatorId], (err, coordinatorResults) => {
        if (err) {
            console.error('Error fetching coordinator department:', err);
            return res.status(500).send('Error fetching coordinator department.');
        }

        if (coordinatorResults.rows.length === 0) {
            return res.status(404).send('Coordinator not found.');
        }

        const coordinatorDepartment = coordinatorResults.rows[0].department;

        // Step 2: Fetch patents with status "Applied" for the coordinator's department
        const patentsQuery = `
            SELECT p.*
            FROM patents p
            JOIN faculty f ON p.faculty_id = f.faculty_id
            WHERE p.status = 'Applied'
            AND f.department = $1;
        `;

        db.query(patentsQuery, [coordinatorDepartment], (err, patentsResults) => {
            if (err) {
                console.error('Error fetching patents:', err);
                return res.status(500).send('Error fetching patents.');
            }

            const patents = patentsResults.rows;

            if (patents.length === 0) {
                return res.status(404).send('No patents applied for approval.');
            }

            // Normalize file paths
            patents.forEach(patent => {
                if (patent.proofofpatent) {
                    patent.proofofpatent = patent.proofofpatent.replace(/\\/g, '/');
                }
            });

            res.json(patents);
        });
    });
});


// Route to approve a publication
app.put('/approvePatent/:id', (req, res) => {
    const patentId = req.params.id;

    const query = 'UPDATE patents SET status = $1 WHERE patent_id = $2';

    db.query(query, ['Approved by Department R&D Coordinator', patentId], (err, result) => {
        if (err) {
            console.error('Error during approval:', err);
            return res.status(500).json({ error: 'Failed to approve patent' });
        }

        if (result.rowCount > 0) {
            return res.status(200).json({ message: 'Patent approved successfully' });
        } else {
            return res.status(404).json({ error: 'Patent not found' });
        }
    });
});

app.put('/rejectPatent/:patentId', (req, res) => {
    const patentId = req.params.patentId;
    const rejectionReason = req.body.rejectionReason;

    // Check if the rejectionReason is empty or undefined
    if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // PostgreSQL uses $1, $2, $3 as placeholders
    const query = `
        UPDATE patents 
        SET status = $1, rejection_reason = $2 
        WHERE patent_id = $3
    `;

    db.query(query, ['Rejected by Department R&D Coordinator', rejectionReason, patentId], (error, result) => {
        if (error) {
            console.error('Error during rejection:', error);
            return res.status(500).json({ message: 'Failed to reject patent' });
        }

        // PostgreSQL uses rowCount instead of affectedRows
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Patent not found' });
        }

        res.status(200).json({ message: 'Patent rejected successfully' });
    });
});


app.get('/getSeedMoneyByDepartment', (req, res) => {
    const coordinatorId = req.query.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).send('Coordinator ID is required.');
    }

    // Step 1: Fetch the coordinator's department
    const coordinatorDepartmentQuery = `
        SELECT department
        FROM depcorlogin
        WHERE coordinatorid = $1;
    `;

    db.query(coordinatorDepartmentQuery, [coordinatorId], (err, coordinatorResults) => {
        if (err) {
            console.error('Error fetching coordinator department:', err);
            return res.status(500).send('Error fetching coordinator department.');
        }

        if (coordinatorResults.rows.length === 0) {
            return res.status(404).send('Coordinator not found.');
        }

        const coordinatorDepartment = coordinatorResults.rows[0].department;

        // Step 2: Fetch seed money applications from faculty of the same department
        const seedMoneyQuery = `
            SELECT s.*
            FROM seedmoney s
            JOIN faculty f ON s.faculty_id = f.faculty_id
            WHERE f.department = $1;
        `;

        db.query(seedMoneyQuery, [coordinatorDepartment], (err, seedMoneyResults) => {
            if (err) {
                console.error('Error fetching seed money applications:', err);
                return res.status(500).send('Error fetching seed money applications.');
            }

            if (seedMoneyResults.rows.length === 0) {
                return res.status(404).send('No seed money applications found for this department.');
            }

            // ✅ Format proof field
            const formattedResults = seedMoneyResults.rows.map(app => {
                if (typeof app.proof === 'string') {
                    try {
                        app.proof = JSON.parse(app.proof).map(file => file.replace(/\\/g, '/'));
                    } catch (error) {
                        console.error('Error parsing proof JSON:', error);
                        app.proof = [];
                    }
                } else if (!Array.isArray(app.proof)) {
                    app.proof = [];
                }
                return app;
            });

            res.json(formattedResults);
        });
    });
});


app.get('/getAllFundedProjects', (req, res) => {
    const coordinatorId = req.query.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).json({ error: 'Coordinator ID is required.' });
    }

    const coordinatorDepartmentQuery = `SELECT department FROM depcorlogin WHERE coordinatorid = $1`;

    db.query(coordinatorDepartmentQuery, [coordinatorId], (err, results) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.rows.length === 0) {
            console.log(`Coordinator ID "${coordinatorId}" not found.`);
            return res.status(404).json({ error: 'Coordinator not found.' });
        }

        const coordinatorDepartment = results.rows[0].department;

        const fundedProjectsQuery = `
            SELECT fp.*
            FROM fundedprojects fp
            JOIN faculty f ON fp.faculty_id = f.faculty_id
            WHERE f.department = $1
        `;

        db.query(fundedProjectsQuery, [coordinatorDepartment], (err, projectsResults) => {
            if (err) {
                console.error('Error fetching funded projects:', err);
                return res.status(500).json({ error: 'Error fetching funded projects.' });
            }

            if (projectsResults.rows.length === 0) {
                console.log(`No funded projects found for department: ${coordinatorDepartment}`);
                return res.status(404).json({ error: 'No funded projects applied for approval.' });
            }
           const formattedRows = projectsResults.rows.map(project => {
        if (project.startdate) {
            const date = new Date(project.startdate);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            project.startdate = `${year}-${month}-${day}`;
        }
        return project;
    });

            res.json(formattedRows);

        });
    });
});


app.get('/getConsultancyByCoordinator', (req, res) => {
    const coordinatorId = req.query.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).json({ error: 'Coordinator ID is required.' });
    }

    const coordinatorDepartmentQuery = `SELECT department FROM depcorlogin WHERE coordinatorid = $1`;

    db.query(coordinatorDepartmentQuery, [coordinatorId], (err, results) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.rows.length === 0) {
            console.log(`Coordinator ID "${coordinatorId}" not found.`);
            return res.status(404).json({ error: 'Coordinator not found.' });
        }

        const coordinatorDepartment = results.rows[0].department;

        const consultancyProjectsQuery = `
            SELECT cp.*
            FROM consultancy_projects cp
            JOIN faculty f ON cp.faculty_id = f.faculty_id
            WHERE f.department = $1
        `;

        db.query(consultancyProjectsQuery, [coordinatorDepartment], (err, projectsResults) => {
            if (err) {
                console.error('Error fetching consultancy projects:', err);
                return res.status(500).json({ error: 'Error fetching consultancy projects.' });
            }

            if (projectsResults.rows.length === 0) {
                console.log(`No consultancy projects found for department: ${coordinatorDepartment}`);
                return res.status(404).json({ error: 'No consultancy projects applied for approval.' });
            }

            // ✅ Format both date fields
            const formattedResults = projectsResults.rows.map(project => {
                if (project.startdateofproject) {
                    const date = new Date(project.startdateofproject);
                    project.startdateofproject = date.toISOString().split('T')[0]; // YYYY-MM-DD
                }

                if (project.dateofamountreceived) {
                    const date = new Date(project.dateofamountreceived);
                    project.dateofamountreceived = date.toISOString().split('T')[0]; // YYYY-MM-DD
                }

                return project;
            });

            res.json(formattedResults);
        });
    });
});

app.get('/getScholarsByCoordinator/:coordinatorid', (req, res) => {
    const coordinatorId = req.params.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).json({ error: 'Coordinator ID is required.' });
    }

    const coordinatorDepartmentQuery = `SELECT department FROM depcorlogin WHERE coordinatorid = $1`;

    db.query(coordinatorDepartmentQuery, [coordinatorId], (err, results) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.rows.length === 0) {
            console.log(`Coordinator ID "${coordinatorId}" not found.`);
            return res.status(404).json({ error: 'Coordinator not found.' });
        }

        const coordinatorDepartment = results.rows[0].department;

        const scholarsQuery = `
            SELECT rs.* 
            FROM research rs
            JOIN faculty f ON rs.faculty_id = f.faculty_id
            WHERE f.department = $1;
        `;

        db.query(scholarsQuery, [coordinatorDepartment], (err, scholarsResults) => {
            if (err) {
                console.error('Error fetching research scholars:', err);
                return res.status(500).json({ error: 'Error fetching research scholars.' });
            }

            if (scholarsResults.rows.length === 0) {
                console.log(`No research scholars found for department: ${coordinatorDepartment}`);
                return res.status(404).json({ error: 'No research scholars found.' });
            }

            res.json(scholarsResults.rows);
        });
    });
});

app.get('/getProposalsByCoordinator/:coordinatorid', (req, res) => {
    const coordinatorId = req.params.coordinatorid;

    if (!coordinatorId) {
        return res.status(400).json({ error: 'Coordinator ID is required.' });
    }

    const coordinatorDepartmentQuery = `
        SELECT department 
        FROM depcorlogin 
        WHERE coordinatorid = $1;
    `;

    db.query(coordinatorDepartmentQuery, [coordinatorId], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.rows.length === 0) {
            console.log(`Coordinator ID "${coordinatorId}" not found.`);
            return res.status(404).json({ error: 'Coordinator not found.' });
        }

        const coordinatorDepartment = results.rows[0].department;

        const proposalsQuery = `
            SELECT p.* 
            FROM proposals p
            JOIN faculty f ON p.faculty_id = f.faculty_id
            WHERE f.department = $1;
        `;

        db.query(proposalsQuery, [coordinatorDepartment], (err, proposalsResults) => {
            if (err) {
                console.error('Error fetching proposals:', err);
                return res.status(500).json({ error: 'Error fetching proposals.' });
            }

            if (proposalsResults.rows.length === 0) {
                console.log(`No proposals found for department: ${coordinatorDepartment}`);
                return res.status(404).json({ error: 'No proposals found.' });
            }

            // ✅ Format submissiondate
            const formattedProposals = proposalsResults.rows.map(proposal => {
                if (proposal.submissiondate) {
                    const date = new Date(proposal.submissiondate);
                    proposal.submissiondate = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
                }
                return proposal;
            });

            res.json(formattedProposals);
        });
    });
});


app.post("/institute_coordinator_login", (req, res) => {
  const { coordinatorid, password } = req.body;

  const sql = "SELECT * FROM InstituteCoordinators WHERE coordinatorid = $1";
  db.query(sql, [coordinatorid], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, coordinatorid: result.rows[0].coordinatorid });
  });
});

  
  app.get('/api/stats/institute/:instituteId', async (req, res) => {
  const { instituteId } = req.params;

  const checkCoordinatorQuery = 'SELECT * FROM institutecoordinators WHERE coordinatorid = $1';

  const queries = {
    total_faculty: 'SELECT COUNT(*) AS count FROM faculty',
    total_publications: 'SELECT COUNT(*) AS count FROM publications',
    total_patents: 'SELECT COUNT(*) AS count FROM patents',
    total_seedmoney: 'SELECT COUNT(*) AS count FROM seedmoney',
    total_external: 'SELECT COUNT(*) AS count FROM fundedprojects',
    total_consultancy: 'SELECT COUNT(*) AS count FROM consultancy_projects',
    total_scholar: 'SELECT COUNT(*) AS count FROM research',
    total_proposal: 'SELECT COUNT(*) AS count FROM proposals',
  };

  try {
    // Check if coordinator exists
    const coordinatorResult = await db.query(checkCoordinatorQuery, [instituteId]);
    if (coordinatorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Coordinator not found' });
    }

    // Execute each query
    const executeQuery = async (query) => {
      const result = await db.query(query);
      return parseInt(result.rows[0].count, 10);
    };

    const stats = await Promise.all(Object.values(queries).map(executeQuery));

    const response = {
      total_faculty: stats[0],
      total_publications: stats[1],
      total_patents: stats[2],
      total_seedmoney: stats[3],
      total_external: stats[4],
      total_consultancy: stats[5],
      total_scholar: stats[6],
      total_proposal: stats[7],
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching institute statistics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  app.get("/getAllPublicationsOfInst", async (req, res) => {
  const sql = `
    SELECT * FROM publications 
    WHERE status = 'Approved by Department R&D Coordinator'
  `;

  try {
    const results = await db.query(sql);
    res.json(results.rows);
  } catch (err) {
    console.error("Error fetching publications:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.put("/approvePublicationOfInst/:publicationId", async (req, res) => {
  const { publicationId } = req.params;

  if (!publicationId) {
    return res.status(400).json({ success: false, message: "Publication ID is required" });
  }

  const sql = `
    UPDATE publications
    SET status = 'Approved by Institute R&D Coordinator'
    WHERE publication_id = $1
  `;

  try {
    const result = await db.query(sql, [publicationId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Publication not found" });
    }

    res.json({ success: true, message: "Publication approved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/rejectPublicationOfInst/:publicationId", async (req, res) => {
  const { publicationId } = req.params;
  const { rejectionReason } = req.body;

  if (!publicationId || !rejectionReason || !rejectionReason.trim()) {
    return res.status(400).json({ success: false, message: "Publication ID and rejection reason are required" });
  }

  const sql = `
    UPDATE publications 
    SET status = 'Rejected by Institute R&D Coordinator', rejection_reason = $1 
    WHERE publication_id = $2
  `;

  try {
    const result = await db.query(sql, [rejectionReason, publicationId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Publication not found" });
    }

    res.json({ success: true, message: "Publication rejected successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/getAllPatentsbyInst", async (req, res) => {
  const sql = `
    SELECT * FROM patents
    WHERE status = 'Approved by Department R&D Coordinator'
  `;

  try {
    const results = await db.query(sql);
    res.json(results.rows);  // in pg, results.rows contains the data
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/approvePatentbyInst/:patent_id", async (req, res) => {
  const { patent_id } = req.params;

  if (!patent_id) {
    return res.status(400).json({ success: false, message: "Patent ID is required" });
  }

  const sql = `
    UPDATE patents
    SET status = 'Approved by Institute R&D Coordinator'
    WHERE patent_id = $1
  `;

  try {
    const result = await db.query(sql, [patent_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Patent not found" });
    }
    res.json({ success: true, message: "Patent approved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/rejectPatentbyInst/:patent_id", async (req, res) => {
  const { patent_id } = req.params;
  const { rejectionReason } = req.body;

  if (!patent_id || !rejectionReason?.trim()) {
    return res.status(400).json({ success: false, message: "Patent ID and rejection reason are required" });
  }

  const sql = `
    UPDATE patents
    SET status = 'Rejected by Institute R&D Coordinator', rejection_reason = $1
    WHERE patent_id = $2
  `;

  try {
    const result = await db.query(sql, [rejectionReason, patent_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Patent not found" });
    }

    res.json({ success: true, message: "Patent rejected successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get('/getAllSeedMoneyApplications', async (req, res) => {
  const query = `SELECT * FROM seedmoney;`;

  try {
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No seed money applications found.' });
    }

    // Parse students field if stored as JSON string
    const formattedResults = rows.map(app => ({
      ...app,
      students: typeof app.students === "string" ? JSON.parse(app.students) : app.students
    }));

    res.json(formattedResults);
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.get('/getAllFundedProjectsInstitute', async (req, res) => {
  const query = `SELECT * FROM fundedprojects;`;

  try {
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No funded projects found.' });
    }

    const formattedResults = rows.map(proj => {
      // Format startdate
      if (proj.startdate) {
        const date = new Date(proj.startdate);
        proj.startdate = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      }

      // Parse students JSON
      return {
        ...proj,
        students: proj.students ? JSON.parse(proj.students) : []
      };
    });

    res.json(formattedResults);
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.get('/getAllConsultancyProjectsInstitute', async (req, res) => {
  const query = `SELECT * FROM consultancy_projects;`;

  try {
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No consultancy projects found.' });
    }

    const formattedResults = rows.map(proj => {
      // Format startdateofproject
      if (proj.startdateofproject) {
        const date = new Date(proj.startdateofproject);
        proj.startdateofproject = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      }

      // Format dateofamountreceived
      if (proj.dateofamountreceived) {
        const date = new Date(proj.dateofamountreceived);
        proj.dateofamountreceived = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      }

      // Parse JSON fields
      return {
        ...proj,
        faculties: typeof proj.faculties === "string" ? JSON.parse(proj.faculties) : proj.faculties,
        report: typeof proj.report === "string" ? JSON.parse(proj.report) : proj.report,
      };
    });

    res.json(formattedResults);
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.get("/getAllScholarsInstitute", async (req, res) => {
  const query = `SELECT * FROM research;`;

  try {
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No scholars found." });
    }

    res.json(rows);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database error." });
  }
});

app.get("/getProposalsByCoordinator", async (req, res) => {
  const query = `SELECT * FROM proposals;`;

  try {
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No proposals found." });
    }

    const formattedResults = rows.map((proposal) => {
      if (proposal.submissiondate) {
        const submissionDate = new Date(proposal.submissiondate);
        proposal.submissiondate = submissionDate.toISOString().split('T')[0];
      }
      return proposal;
    });

    res.json(formattedResults);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database error." });
  }
});


const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
