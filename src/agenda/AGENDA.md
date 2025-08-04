  Step 1: Obtain JWT Token for the User

  First, you need to log in as the user for whom you want to configure the agenda to get an authentication token.

  Request: POST /auth/login
  Headers: Content-Type: application/json
  Body:

    {
      "email": "estilista@glamour.com",
      "password": "12345678"
    }

  Curl Command:

    curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "estilista@glour.com",
      "password": "12345678"
    }'

  Expected Response:
  You will receive a JSON object containing an accessToken. Copy this token; you'll use it in subsequent requests as a Bearer token.

    {
      "accessToken": "YOUR_JWT_TOKEN_HERE"
    }

  ---

  Step 2: Configure the User's Agenda

  Now, use the obtained JWT token to set up the agenda configuration for the "Estilista" user. This defines their working hours, slot duration, and working days.

  Request: PATCH /agenda/config
  Headers:
   * Content-Type: application/json
   * Authorization: Bearer YOUR_JWT_TOKEN_HERE (Replace YOUR_JWT_TOKEN_HERE with the token from Step 1)
  Body:

    {
      "startTime": "09:00",
      "endTime": "18:00", 
      "slotDuration": 30,
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],  
      "allowOverbooking": false,
      "allowBookingOnBlockedDays": false
    }


1 {
      "startTime": "09:00",
      "endTime": "18:00",
      "slotDuration": 30,
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      "allowOverbooking": false,
      "allowBookingOnBlockedDays": false
    }
  Curl Command:

    curl -X PATCH http://localhost:3000/agenda/config \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
    -d '{
      "startTime": "09:00",
      "endTime": "18:00",
      "slotDuration": 30,
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "allowOverbooking": false,
      "allowBookingOnBlockedDays": false
    }'

  Expected Response:
  HTTP 200 OK, with the AgendaConfigResponseDto reflecting the saved configuration.

  ---

  Step 3: Add Holidays (Optional)

  If the user has specific days they won't be working, you can add them as holidays.

  Request: POST /agenda/holiday
  Headers:
   * Content-Type: application/json
   * Authorization: Bearer YOUR_JWT_TOKEN_HERE
  Body:

    {
      "date": "2025-08-15",
      "reason": "Vacaciones de verano"
    }

  Curl Command:

    curl -X POST http://localhost:3000/agenda/holiday \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
    -d '{
      "date": "2025-08-15",
      "reason": "Vacaciones de verano"
    }'

  Expected Response:
  HTTP 201 Created, with the HolidayResponseDto for the added holiday.

  ---

  Step 4: Book an Appointment

  Now that the agenda is configured, you can book appointments.

  Request: POST /agenda/book
  Headers:
   * Content-Type: application/json
   * Authorization: Bearer YOUR_JWT_TOKEN_HERE
  Body:

    {
      "date": "2025-08-01",
      "time": "10:00",
      "title": "Cita de Prueba",
      "description": "Revisión general",
      "clientId": 1,
      "professionalId": 2
    }
   * Note: clientId (e.g., 1 for Ana Torres from seed) and professionalId (e.g., 2 for Estilista) are optional if the booking user is the professional and no client is associated. However, for clarity and full control, it's good practice to include them.

  Curl Command:

     curl -X POST http://localhost:3000/agenda/book \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
     -d '{
       "date": "2025-08-01",
       "time": "10:00",
       "title": "Cita de Prueba",
       "description": "Revisión general",
       "clientId": 1,
       "professionalId": 2
     }'

  Expected Response:
  HTTP 201 Created, with the AppointmentResponseDto for the newly booked appointment.

  ---

  Step 5: Verify Available Slots (Optional)

  You can check available slots for a specific date.

  Request: GET /agenda/available
  Headers: Authorization: Bearer YOUR_JWT_TOKEN_HERE
  Query Parameters:
   * date: 2025-08-01 (or any date you want to check)
   * professionalId: 2 (optional, if checking for another professional as admin)

  Curl Command:

   1 curl -X GET "http://localhost:3000/agenda/available?date=2025-08-01&professionalId=2" \
   2 -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

  Expected Response:
  HTTP 200 OK, with AvailableSlotResponseDto showing available and taken slots for the specified date.