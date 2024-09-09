const request = require('supertest');
const app = require('../server'); // Adjust the path to your server.js file
const db = require('../db'); // Import the knex instance

let server; // Declare server variable to close after tests

beforeAll((done) => {
  // Start the server before running the tests
  server = app.listen(0, () => { // Use a random port
    console.log('Test server running');
    done();
  });
});

afterAll(async () => {
  // Close the server and destroy the knex connection
  await server.close();
  await db.destroy(); // Properly destroy knex connection
});

describe('Test the root path', () => {
  it('should respond with status 200 and return "Hello World"', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello World');
  });
});

// Test for the /boats endpoint
describe('GET /boats', () => {
  it('should return at least one boat', async () => {
    const response = await request(app).get('/boats');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Check if response is an array
    expect(response.body.length).toBeGreaterThan(0); // Expect at least one boat
  });
});

// Test for the /boats_view/:view endpoint
describe('GET /boats_view/:view', () => {
  it('should return at least one boat_view for the given view', async () => {
    const viewName = 'Parking'; // Replace this with an actual view from your database
    const response = await request(app).get(`/boats_view/${viewName}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Check if response is an array
    expect(response.body.length).toBeGreaterThan(0); // Expect at least one boat_view
  });
});
