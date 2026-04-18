const axios = require('axios');

jest.mock('axios');

describe('API Tesztek', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET keres sikeres', async () => {
    const mockData = { id: 1, name: 'Test User' };
    axios.get.mockResolvedValue({ data: mockData, status: 200 });

    const response = await axios.get('/api/users/1');

    expect(response.data).toEqual(mockData);
    expect(response.status).toBe(200);
    expect(axios.get).toHaveBeenCalledWith('/api/users/1');
  });

  test('POST keres sikeres', async () => {
    const postData = { username: 'testuser', password: 'password123' };
    const mockResponse = { token: 'abc123', user: { id: 1, username: 'testuser' } };

    axios.post.mockResolvedValue({ data: mockResponse, status: 201 });

    const response = await axios.post('/api/auth/login', postData);

    expect(response.data).toEqual(mockResponse);
    expect(response.status).toBe(201);
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', postData);
  });

  test('API hiba 404 kezeles', async () => {
    const errorMessage = 'Not Found';
    axios.get.mockRejectedValue({
      response: { status: 404, data: { message: errorMessage } }
    });

    try {
      await axios.get('/api/users/999');
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe(errorMessage);
    }

    expect(axios.get).toHaveBeenCalledWith('/api/users/999');
  });

  test('JSON response feldolgozas', async () => {
    const jsonData = {
      users: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ]
    };

    axios.get.mockResolvedValue({ data: jsonData, status: 200 });

    const response = await axios.get('/api/users');
    const parsedData = response.data;

    expect(parsedData.users).toHaveLength(2);
    expect(parsedData.users[0].name).toBe('User 1');
  });

  test('Authorization header hozzaadasa token-nel', async () => {
    const token = 'bearer-token-123';
    const mockConfig = {
      headers: { Authorization: `Bearer ${token}` }
    };

    axios.get.mockResolvedValue({ data: {}, status: 200 });

    await axios.get('/api/protected', mockConfig);

    expect(axios.get).toHaveBeenCalledWith('/api/protected', mockConfig);
  });
});
