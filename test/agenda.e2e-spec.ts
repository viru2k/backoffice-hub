import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from './../src/common/guards/permissions.guard';
import { AppointmentStatus } from './../src/agenda/entities/appointment.entity';
import { format, addDays, addHours, addMinutes } from 'date-fns';

// Mock the guards to simplify testing and focus on controller/service logic
const mockAuthGuard = {
  canActivate: jest.fn((context) => {
    const req = context.switchToHttp().getRequest();
    // Mock a user for testing purposes. Adjust as needed for specific tests.
    req.user = { id: 2, email: 'estilista@glamour.com', isAdmin: false, roles: [{ permissions: [{ name: 'agenda:write:own' }, { name: 'agenda:read:own' }, { name: 'agenda:write:group' }, { name: 'agenda:read:group' }] }] };
    return true;
  }),
};

const mockPermissionsGuard = {
  canActivate: jest.fn(() => true),
};

describe('AgendaController (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    agent = request(app.getHttpServer());

    // Ensure the database is seeded for consistent test data
    // You might need to run the seed manually before running tests
    // or integrate it into the test setup if it's fast enough.
    // For now, assume seed is run externally: docker-compose down -v && docker-compose up --build

    // Configure agenda for the mocked user (estilista@glamour.com - ID 2)
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const tomorrowDateString = format(tomorrow, 'yyyy-MM-dd');

    await agent
      .patch('/agenda/config')
      .send({
        startTime: '09:00',
        endTime: '18:00',
        slotDuration: 45,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        allowOverbooking: false,
        allowBookingOnBlockedDays: false,
      })
      .expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /agenda/book', () => {
    it('should successfully book an appointment', async () => {
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '10:00'; // Assuming 10:00 is available

      const response = await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Test Appointment',
          description: 'A test booking',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Appointment');
      expect(response.body.status).toBe(AppointmentStatus.CONFIRMED);
      expect(response.body.professional.id).toBe(2); // Mocked user ID
    });

    it('should return 400 if booking on a non-working day', async () => {
      const sunday = addDays(new Date(), 7 - new Date().getDay()); // Next Sunday
      const date = format(sunday, 'yyyy-MM-dd');
      const time = '10:00';

      await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Sunday Appointment',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({ statusCode: 400, message: 'Día no habilitado para turnos.', error: 'Bad Request' });
    });

    it('should return 400 if booking outside working hours', async () => {
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '08:00'; // Before 09:00 start time

      await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Early Appointment',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({ statusCode: 400, message: 'Hora fuera del horario configurado para el profesional.', error: 'Bad Request' });
    });

    it('should return 400 if there is an overlapping appointment and overbooking is not allowed', async () => {
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time1 = '11:00';
      const time2 = '11:30'; // Overlaps with a 45-min slot starting at 11:00

      // Book first appointment
      await agent
        .post('/agenda/book')
        .send({
          date,
          time: time1,
          title: 'First Appointment',
        })
        .expect(HttpStatus.CREATED);

      // Attempt to book overlapping appointment
      await agent
        .post('/agenda/book')
        .send({
          date,
          time: time2,
          title: 'Overlapping Appointment',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({ statusCode: 400, message: 'Ya hay un turno en ese horario para el profesional.', error: 'Bad Request' });
    });

    it('should successfully book an appointment for another professional as admin', async () => {
      // Mock admin user
      mockAuthGuard.canActivate.mockImplementationOnce((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 1, email: 'peluqueria@glamour.com', isAdmin: true, roles: [{ permissions: [{ name: 'agenda:write:group' }] }] };
        return true;
      });

      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '12:00'; // Assuming 12:00 is available for professional ID 4 (medico@vision.com)

      // Ensure professional ID 4 has agenda config
      await agent
        .patch('/agenda/config?professionalId=4')
        .send({
          startTime: '08:00',
          endTime: '16:00',
          slotDuration: 20,
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          allowOverbooking: false,
          allowBookingOnBlockedDays: false,
        })
        .expect(HttpStatus.OK);

      const response = await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Admin booked for Medico',
          professionalId: 4, // Medico ID
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.professional.id).toBe(4);
    });

    it('should return 403 if non-admin tries to book for another professional', async () => {
      // Mock non-admin user (estilista)
      mockAuthGuard.canActivate.mockImplementationOnce((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 2, email: 'estilista@glamour.com', isAdmin: false, roles: [{ permissions: [{ name: 'agenda:write:own' }] }] };
        return true;
      });

      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '13:00';

      await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Unauthorized booking',
          professionalId: 4, // Medico ID
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should successfully book an appointment with a client', async () => {
      // Mock user (estilista)
      mockAuthGuard.canActivate.mockImplementationOnce((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 2, email: 'estilista@glamour.com', isAdmin: false, roles: [{ permissions: [{ name: 'agenda:write:own' }] }] };
        return true;
      });

      // Assuming client ID 1 exists from seed (Ana Torres)
      const clientId = 1;
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '14:00';

      const response = await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Appointment with Client',
          clientId,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.client.id).toBe(clientId);
    });

    it('should return 404 if client ID is not found', async () => {
      // Mock user (estilista)
      mockAuthGuard.canActivate.mockImplementationOnce((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 2, email: 'estilista@glamour.com', isAdmin: false, roles: [{ permissions: [{ name: 'agenda:write:own' }] }] };
        return true;
      });

      const nonExistentClientId = 9999;
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '15:00';

      await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Appointment with Non-existent Client',
          clientId: nonExistentClientId,
        })
        .expect(HttpStatus.NOT_FOUND)
        .expect({ statusCode: 404, message: `Cliente con ID ${nonExistentClientId} no encontrado.`, error: 'Not Found' });
    });
  });

  describe('POST /agenda/book with overbooking allowed', () => {
    const professionalId = 2; // Mocked user ID

    beforeAll(async () => {
      // Configure agenda to allow overbooking
      await agent
        .patch(`/agenda/config?professionalId=${professionalId}`)
        .send({
          startTime: '09:00',
          endTime: '18:00',
          slotDuration: 45,
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          allowOverbooking: true,
          allowBookingOnBlockedDays: false,
        })
        .expect(HttpStatus.OK);
    });

    it('should successfully book an overlapping appointment when overbooking is allowed', async () => {
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time1 = '10:00';
      const time2 = '10:15'; // Overlaps with a 45-min slot starting at 10:00

      // Book first appointment
      await agent
        .post('/agenda/book')
        .send({
          date,
          time: time1,
          title: 'First Overbooking Appointment',
          professionalId: professionalId,
        })
        .expect(HttpStatus.CREATED);

      // Attempt to book overlapping appointment
      const response = await agent
        .post('/agenda/book')
        .send({
          date,
          time: time2,
          title: 'Second Overbooking Appointment',
          professionalId: professionalId,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Second Overbooking Appointment');
    });
  });

  describe('PATCH /agenda/:id', () => {
    const professionalId = 2; // Mocked user ID

    // Define all possible status transitions for testing
    const allStatuses = Object.values(AppointmentStatus);
    const validTransitions = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
      [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
      [AppointmentStatus.RESCHEDULED]: [],
    };

    for (const fromStatus of Object.keys(validTransitions)) {
      for (const toStatus of validTransitions[fromStatus]) {
        it(`should allow transition from ${fromStatus} to ${toStatus}`, async () => {
          // Book an appointment with the initial status
          const tomorrow = addDays(new Date(), 1);
          const date = format(tomorrow, 'yyyy-MM-dd');
          const time = '09:00';

          const initialAppointmentResponse = await agent
            .post('/agenda/book')
            .send({
              date,
              time,
              title: `Test ${fromStatus} to ${toStatus}`,
              professionalId: professionalId,
            })
            .expect(HttpStatus.CREATED);

          const appointmentId = initialAppointmentResponse.body.id;

          // Update the status to the target status
          const updateResponse = await agent
            .patch(`/agenda/${appointmentId}`)
            .send({ status: toStatus })
            .expect(HttpStatus.OK);

          expect(updateResponse.body.status).toBe(toStatus);
        });
      }
    }

    for (const fromStatus of allStatuses) {
      for (const toStatus of allStatuses) {
        // Skip valid transitions, already tested
        if (validTransitions[fromStatus] && validTransitions[fromStatus].includes(toStatus)) {
          continue;
        }
        // Skip if fromStatus is a terminal state (no outgoing transitions)
        if (validTransitions[fromStatus] && validTransitions[fromStatus].length === 0 && fromStatus !== toStatus) {
          it(`should not allow transition from terminal state ${fromStatus} to ${toStatus}`, async () => {
            // Book an appointment with the initial status
            const tomorrow = addDays(new Date(), 1);
            const date = format(tomorrow, 'yyyy-MM-dd');
            const time = '10:00'; // Use a different time to avoid conflicts

            const initialAppointmentResponse = await agent
              .post('/agenda/book')
              .send({
                date,
                time,
                title: `Test Invalid ${fromStatus} to ${toStatus}`,
                professionalId: professionalId,
              })
              .expect(HttpStatus.CREATED);

            const appointmentId = initialAppointmentResponse.body.id;

            // Directly update the status in the database to the terminal fromStatus
            // This is a workaround because the booking process always starts with PENDING
            // In a real scenario, you'd have a way to set initial status for testing terminal states
            const connection = app.get(getConnection);
            await connection.getRepository(Appointment).update(appointmentId, { status: fromStatus });

            await agent
              .patch(`/agenda/${appointmentId}`)
              .send({ status: toStatus })
              .expect(HttpStatus.BAD_REQUEST)
              .expect(res => {
                expect(res.body.message).toContain(`Transición de estado inválida de ${fromStatus} a ${toStatus}.`);
              });
          });
          continue;
        }

        // Test invalid transitions (where toStatus is not in validTransitions for fromStatus)
        if (!(validTransitions[fromStatus] && validTransitions[fromStatus].includes(toStatus))) {
          it(`should not allow invalid transition from ${fromStatus} to ${toStatus}`, async () => {
            // Book an appointment with the initial status
            const tomorrow = addDays(new Date(), 1);
            const date = format(tomorrow, 'yyyy-MM-dd');
            const time = '11:00'; // Use a different time to avoid conflicts

            const initialAppointmentResponse = await agent
              .post('/agenda/book')
              .send({
                date,
                time,
                title: `Test Invalid ${fromStatus} to ${toStatus}`,
                professionalId: professionalId,
              })
              .expect(HttpStatus.CREATED);

            const appointmentId = initialAppointmentResponse.body.id;

            // Directly update the status in the database to the fromStatus if it's not PENDING
            if (fromStatus !== AppointmentStatus.PENDING) {
              const connection = app.get(getConnection);
              await connection.getRepository(Appointment).update(appointmentId, { status: fromStatus });
            }

            await agent
              .patch(`/agenda/${appointmentId}`)
              .send({ status: toStatus })
              .expect(HttpStatus.BAD_REQUEST)
              .expect(res => {
                expect(res.body.message).toContain(`Transición de estado inválida de ${fromStatus} a ${toStatus}.`);
              });
          });
        }
      }
    }

    it('should successfully update other appointment fields', async () => {
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '12:00';

      const response = await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Appointment for Field Update Test',
          professionalId: professionalId,
        })
        .expect(HttpStatus.CREATED);
      const appointmentId = response.body.id;

      const newTitle = 'Updated Test Title';
      const newNotes = 'Updated notes for the appointment.';

      const updateResponse = await agent
        .patch(`/agenda/${appointmentId}`)
        .send({ title: newTitle, notes: newNotes })
        .expect(HttpStatus.OK);

      expect(updateResponse.body.title).toBe(newTitle);
      expect(updateResponse.body.notes).toBe(newNotes);
    });
  });

  describe('POST /agenda (manual creation)', () => {
    it('should allow an admin to create a manual appointment for another professional', async () => {
      // Mock admin user
      mockAuthGuard.canActivate.mockImplementationOnce((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 1, email: 'admin@glamour.com', isAdmin: true, roles: [{ permissions: [{ name: 'agenda:write:group' }] }] };
        return true;
      });

      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '10:00';
      const targetProfessionalId = 4; // Medico ID

      const createAppointmentDto = {
        professionalId: targetProfessionalId,
        date,
        time,
        title: 'Manual Appointment for Medico',
        description: 'Created by admin',
        status: AppointmentStatus.CONFIRMED,
      };

      const response = await agent
        .post('/agenda')
        .send(createAppointmentDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.professional.id).toBe(targetProfessionalId);
      expect(response.body.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should not allow a non-admin to create a manual appointment for another professional', async () => {
      // Mock non-admin user (estilista)
      mockAuthGuard.canActivate.mockImplementationOnce((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 2, email: 'estilista@glamour.com', isAdmin: false, roles: [{ permissions: [{ name: 'agenda:write:own' }] }] };
        return true;
      });

      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '11:00';
      const targetProfessionalId = 4; // Medico ID

      const createAppointmentDto = {
        professionalId: targetProfessionalId,
        date,
        time,
        title: 'Unauthorized Manual Appointment',
        description: 'Attempted by non-admin',
        status: AppointmentStatus.PENDING,
      };

      await agent
        .post('/agenda')
        .send(createAppointmentDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /agenda/:id', () => {
    let appointmentId: string;

    beforeEach(async () => {
      // Book an appointment to delete
      const tomorrow = addDays(new Date(), 1);
      const date = format(tomorrow, 'yyyy-MM-dd');
      const time = '16:00';

      const response = await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Appointment for Deletion Test',
        })
        .expect(HttpStatus.CREATED);
      appointmentId = response.body.id;
    });

    it('should mark an appointment as CANCELLED when deleted', async () => {
      const response = await agent
        .delete(`/agenda/${appointmentId}`)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('GET /agenda/config and PATCH /agenda/config', () => {
    const professionalId = 2; // Mocked user ID

    it('should get the agenda configuration', async () => {
      const response = await agent
        .get(`/agenda/config?professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('startTime', '09:00');
      expect(response.body).toHaveProperty('endTime', '18:00');
      expect(response.body).toHaveProperty('slotDuration', 45);
    });

    it('should update the agenda configuration', async () => {
      const updateConfigDto = {
        startTime: '08:30',
        endTime: '17:30',
        slotDuration: 30,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        allowOverbooking: true,
        allowBookingOnBlockedDays: true,
      };

      const response = await agent
        .patch(`/agenda/config?professionalId=${professionalId}`)
        .send(updateConfigDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('startTime', '08:30');
      expect(response.body).toHaveProperty('endTime', '17:30');
      expect(response.body).toHaveProperty('slotDuration', 30);
      expect(response.body.workingDays).toEqual(expect.arrayContaining(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']));
      expect(response.body).toHaveProperty('allowOverbooking', true);
      expect(response.body).toHaveProperty('allowBookingOnBlockedDays', true);
    });
  });

  describe('GET /agenda/available', () => {
    const professionalId = 2; // Mocked user ID

    it('should return available slots for an empty day', async () => {
      const today = new Date();
      const date = format(today, 'yyyy-MM-dd');

      const response = await agent
        .get(`/agenda/available?date=${date}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('date', date);
      expect(Array.isArray(response.body.slots)).toBe(true);
      expect(response.body.slots.length).toBeGreaterThan(0);
      expect(response.body.slots[0]).toHaveProperty('time');
      expect(response.body.slots[0]).toHaveProperty('available', true);
    });

    it('should mark slots as unavailable after an appointment is booked', async () => {
      const today = new Date();
      const date = format(today, 'yyyy-MM-dd');
      const time = '10:00';

      // Book an appointment
      await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Appointment for Slot Test',
          professionalId: professionalId,
        })
        .expect(HttpStatus.CREATED);

      const response = await agent
        .get(`/agenda/available?date=${date}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      const bookedSlot = response.body.slots.find(slot => slot.time === time);
      expect(bookedSlot).toHaveProperty('available', false);
    });

    it('should not return slots on a non-working day (Sunday)', async () => {
      const sunday = addDays(new Date(), 7 - new Date().getDay()); // Next Sunday
      const date = format(sunday, 'yyyy-MM-dd');

      const response = await agent
        .get(`/agenda/available?date=${date}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('date', date);
      expect(response.body.slots.length).toBe(0);
    });

    it('should not return slots on a holiday', async () => {
      const today = new Date();
      const holidayDate = format(addDays(today, 2), 'yyyy-MM-dd'); // Two days from now

      // Add a holiday
      await agent
        .post(`/agenda/holiday?professionalId=${professionalId}`)
        .send({
          date: holidayDate,
          reason: 'Test Holiday',
        })
        .expect(HttpStatus.CREATED);

      const response = await agent
        .get(`/agenda/available?date=${holidayDate}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('date', holidayDate);
      expect(response.body.slots.length).toBe(0);
    });
  });
});

  describe('GET /agenda/config and PATCH /agenda/config', () => {
    const professionalId = 2; // Mocked user ID

    it('should get the agenda configuration', async () => {
      const response = await agent
        .get(`/agenda/config?professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('startTime', '09:00');
      expect(response.body).toHaveProperty('endTime', '18:00');
      expect(response.body).toHaveProperty('slotDuration', 45);
    });

    it('should update the agenda configuration', async () => {
      const updateConfigDto = {
        startTime: '08:30',
        endTime: '17:30',
        slotDuration: 30,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        allowOverbooking: true,
        allowBookingOnBlockedDays: true,
      };

      const response = await agent
        .patch(`/agenda/config?professionalId=${professionalId}`)
        .send(updateConfigDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('startTime', '08:30');
      expect(response.body).toHaveProperty('endTime', '17:30');
      expect(response.body).toHaveProperty('slotDuration', 30);
      expect(response.body.workingDays).toEqual(expect.arrayContaining(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']));
      expect(response.body).toHaveProperty('allowOverbooking', true);
      expect(response.body).toHaveProperty('allowBookingOnBlockedDays', true);
    });
  });

  describe('GET /agenda/available', () => {
    const professionalId = 2; // Mocked user ID

    it('should return available slots for an empty day', async () => {
      const today = new Date();
      const date = format(today, 'yyyy-MM-dd');

      const response = await agent
        .get(`/agenda/available?date=${date}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('date', date);
      expect(Array.isArray(response.body.slots)).toBe(true);
      expect(response.body.slots.length).toBeGreaterThan(0);
      expect(response.body.slots[0]).toHaveProperty('time');
      expect(response.body.slots[0]).toHaveProperty('available', true);
    });

    it('should mark slots as unavailable after an appointment is booked', async () => {
      const today = new Date();
      const date = format(today, 'yyyy-MM-dd');
      const time = '10:00';

      // Book an appointment
      await agent
        .post('/agenda/book')
        .send({
          date,
          time,
          title: 'Appointment for Slot Test',
          professionalId: professionalId,
        })
        .expect(HttpStatus.CREATED);

      const response = await agent
        .get(`/agenda/available?date=${date}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      const bookedSlot = response.body.slots.find(slot => slot.time === time);
      expect(bookedSlot).toHaveProperty('available', false);
    });

    it('should not return slots on a non-working day (Sunday)', async () => {
      const sunday = addDays(new Date(), 7 - new Date().getDay()); // Next Sunday
      const date = format(sunday, 'yyyy-MM-dd');

      const response = await agent
        .get(`/agenda/available?date=${date}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('date', date);
      expect(response.body.slots.length).toBe(0);
    });

    it('should not return slots on a holiday', async () => {
      const today = new Date();
      const holidayDate = format(addDays(today, 2), 'yyyy-MM-dd'); // Two days from now

      // Add a holiday
      await agent
        .post(`/agenda/holiday?professionalId=${professionalId}`)
        .send({
          date: holidayDate,
          reason: 'Test Holiday',
        })
        .expect(HttpStatus.CREATED);

      const response = await agent
        .get(`/agenda/available?date=${holidayDate}&professionalId=${professionalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('date', holidayDate);
      expect(response.body.slots.length).toBe(0);
    });
  });
});
