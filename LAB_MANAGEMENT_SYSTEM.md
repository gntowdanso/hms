# Hospital Lab Management System

## Overview
A comprehensive laboratory management system integrated into the Hospital Management System (HMS). The system provides complete functionality for managing laboratory operations including test types, test configurations, patient lab requests, and test results.

## Features Implemented

### 1. Lab Dashboard (`/lab`)
The main landing page for the laboratory management system providing:
- **Statistics Overview**: Real-time counts of lab types, tests, requests, and results
- **Status Tracking**: Separate counts for pending and completed lab requests
- **Quick Access Cards**: Direct navigation to all lab management pages
- **Recent Requests Table**: Display of the 5 most recent lab requests with patient and test information
- **Color-coded Status Indicators**: Visual distinction between pending and completed requests

### 2. Lab Types Management (`/lab/types`)
Manage different categories of laboratory tests:
- Create, read, update, and delete lab type categories
- Search and filter lab types by name
- Pagination support (5, 10, or 20 items per page)
- Examples: Hematology, Chemistry, Microbiology, Immunology, etc.

### 3. Lab Tests Configuration (`/lab/tests`)
Configure specific tests available in the laboratory:
- Define test names and descriptions
- Associate tests with lab types and departments
- Set test pricing/costs
- Search and filter by test name
- Full CRUD operations with pagination

### 4. Lab Requests Management (`/lab/requests`)
Handle test requests from doctors for patients:
- Create new lab requests specifying:
  - Patient (selected from patient database)
  - Doctor (requesting physician)
  - Lab test required
  - Request date and time
  - Status (PENDING, COMPLETED, etc.)
- Image support:
  - Upload images as base64 or provide image URL
  - Image preview functionality
  - Support for lab request forms or prescriptions
- Search and filter by patient, doctor, test, or status
- Edit and delete existing requests
- Track request status workflow

### 5. Lab Results Entry (`/lab/results`)
Record and manage test results:
- Associate results with lab requests
- Enter result details and findings
- Set result date and verifying staff member
- Image attachments for result reports
- Support for detailed result breakdowns
- Search and filter capabilities
- Full CRUD operations

### 6. Result Details (`/lab/resultdetails`)
Detailed laboratory result entries with:
- Test codes and values
- Reference ranges for comparison
- Flags for abnormal results (HIGH, LOW, NORMAL)
- Result ratings
- Units of measurement
- Link to parent lab request and lab result

## Database Schema

The system uses the following Prisma models:

### LabType
```prisma
model LabType {
  id        Int       @id @default(autoincrement())
  name      String
  labTests  LabTest[]
}
```

### LabTest
```prisma
model LabTest {
  id           Int          @id @default(autoincrement())
  username     String
  labTypeId    Int
  labtype      LabType      @relation(fields:[labTypeId], references:[id])
  testName     String
  description  String?
  departmentId Int
  department   Department   @relation(fields: [departmentId], references: [id])
  cost         Float
  requests     LabRequest[]
}
```

### LabRequest
```prisma
model LabRequest {
  id          Int        @id @default(autoincrement())
  username    String
  patientId   Int
  doctorId    Int
  testId      Int
  requestDate DateTime
  status      String
  patient     Patient    @relation(fields: [patientId], references: [id])
  doctor      Doctor     @relation(fields: [doctorId], references: [id])
  test        LabTest    @relation(fields: [testId], references: [id])
  result      LabResult?
  imageBase64 String?
  imageURL    String?
  details     LabResultDetails[]
}
```

### LabResult
```prisma
model LabResult {
  id            Int        @id @default(autoincrement())
  username      String
  labRequestId  Int        @unique
  resultDetails String
  resultDate    DateTime
  verifiedBy    Int
  labRequest    LabRequest @relation(fields: [labRequestId], references: [id])
  imageBase64   String?
  imageURL      String?
  details       LabResultDetails[]
}
```

### LabResultDetails
```prisma
model LabResultDetails {
  id             Int        @id @default(autoincrement())
  username       String
  labRequestId   Int
  labResultId    Int
  code           String
  result         String
  referenceRange String?
  flag           String?
  rating         String?
  unit           String?
  labRequest     LabRequest @relation(fields: [labRequestId], references: [id])
  labResult      LabResult  @relation(fields: [labResultId], references: [id])
}
```

## API Endpoints

All lab-related operations are exposed through RESTful API endpoints:

- `GET/POST/PUT/DELETE /api/labtypes` - Lab type management
- `GET/POST/PUT/DELETE /api/labtests` - Lab test configuration
- `GET/POST/PUT/DELETE /api/labrequests` - Lab request handling
- `GET/POST/PUT/DELETE /api/labresults` - Lab result entry
- `GET/POST/PUT/DELETE /api/labresultdetails` - Detailed result management

All endpoints support:
- Query parameters for filtering (e.g., `?id=1`, `?patientId=5`)
- Proper error handling with HTTP status codes
- JSON request/response format

## Navigation

The lab management system is accessible through the sidebar menu under the "Lab" group:

```
Lab
├── Lab Dashboard
├── Lab Types
├── Lab Tests
├── Lab Requests
├── Lab Results
└── Result Details
```

## Typical Workflow

1. **Setup Phase**:
   - Admin creates lab types (categories)
   - Admin configures available lab tests with pricing

2. **Request Phase**:
   - Doctor examines patient
   - Doctor creates lab request for specific test
   - Request status set to PENDING

3. **Testing Phase**:
   - Lab technician receives pending request
   - Performs laboratory test
   - Records results in system

4. **Result Phase**:
   - Lab technician enters result details
   - Adds reference ranges and interpretations
   - Result verified by senior staff
   - Request status updated to COMPLETED

5. **Review Phase**:
   - Doctor views completed results
   - Results inform treatment decisions

## Features

### Search and Filtering
All pages include:
- Real-time search across relevant fields
- Case-insensitive filtering
- Instant results without page refresh

### Pagination
- Configurable page size (5, 10, or 20 items)
- Previous/Next navigation
- Display of current page range

### Image Support
- Upload images as files (converted to base64)
- Provide image URLs
- Image preview before submission
- Support for both lab request forms and result reports

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

### User Feedback
- Success/error messages for all operations
- Loading indicators during async operations
- Confirmation prompts for destructive actions

## Security Considerations

✅ **Implemented Security Measures**:
- Input validation on all form submissions
- Type safety with TypeScript
- SQL injection protection via Prisma ORM
- Proper error handling to prevent information leakage
- Authentication checks via apiFetch utility

✅ **CodeQL Security Scan**: Passed with 0 vulnerabilities detected

## Technology Stack

- **Frontend**: React 19.1.0, Next.js 15.5.2
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM 6.0.1
- **Styling**: Tailwind CSS 4
- **Icons**: React Icons 5.5.0
- **Type Safety**: TypeScript 5

## Future Enhancements

Potential improvements for the lab management system:

1. **Reporting**: Generate PDF reports for lab results
2. **Analytics**: Dashboard with charts for test volumes and turnaround times
3. **Notifications**: Alert doctors when results are ready
4. **Batch Processing**: Handle multiple tests in a single request
5. **Quality Control**: Track QC samples and calibration
6. **Equipment Management**: Track lab equipment and maintenance
7. **Integration**: Connect with lab instruments for automated result import
8. **Audit Trail**: Comprehensive logging of all changes
9. **Role-Based Access**: Different permissions for lab techs, doctors, admins

## Testing

To test the lab management system:

1. **Setup Database**:
   ```bash
   npx prisma migrate dev --name init_hms
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Lab Dashboard**:
   Navigate to `http://localhost:3000/lab`

4. **Test Workflow**:
   - Create a lab type
   - Add a lab test under that type
   - Create a lab request
   - Enter results for the request
   - Add detailed result entries

## Support

For issues or questions:
- Check the main README.md for general HMS documentation
- Review API endpoint documentation in respective route files
- Examine Prisma schema for data model details
